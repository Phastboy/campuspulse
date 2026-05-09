import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as path from 'path';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { StorageProvider, UploadParams, UploadResult } from './ports/provider.port.js';

const MAGIC_PEEK_BYTES = 12;

/**
 * Verifies file integrity via magic numbers (byte checking).
 * Operates on just the first MAGIC_PEEK_BYTES bytes of the stream.
 */
function detectMimeType(head: Buffer): string | undefined {
  if (head.length < 4) return undefined;
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47)
    return 'image/png';
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg';
  if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x38)
    return 'image/gif';
  if (
    head.length >= 12 &&
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  )
    return 'image/webp';
  return undefined;
}

/**
 * Reads exactly `n` bytes from a paused Readable, then unshifts them back
 * so the stream is whole for downstream consumers.
 */
async function peekStream(stream: Readable, n: number): Promise<Buffer> {
  // Ensure paused mode
  stream.pause();

  // Wait for data to be available if the buffer is empty
  const chunk: Buffer | null = await new Promise((resolve, reject) => {
    const onReadable = () => {
      stream.removeListener('error', onError);
      resolve(stream.read(n) as Buffer | null);
    };
    const onError = (err: Error) => {
      stream.removeListener('readable', onReadable);
      reject(err);
    };
    stream.once('readable', onReadable);
    stream.once('error', onError);

    // If data is already buffered, read immediately
    const immediate = stream.read(n) as Buffer | null;
    if (immediate !== null) {
      stream.removeListener('readable', onReadable);
      stream.removeListener('error', onError);
      resolve(immediate);
    }
  });

  if (!chunk || chunk.length === 0) {
    throw new BadRequestException('File stream is empty.');
  }

  // Put the bytes back so the adapter sees a complete stream
  stream.unshift(chunk);

  return chunk;
}

@Injectable()
export class ImageStorageService {
  private readonly logger = new Logger(ImageStorageService.name);
  private readonly allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  private readonly allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

  constructor(private readonly storageProvider: StorageProvider) {}

  /**
   * Orchestrates a safe image replacement.
   * Validates and uploads the new file first, then triggers cleanup of the old file.
   */
  async replaceImage(params: UploadParams, previousFileId?: string): Promise<UploadResult> {
    const uploadResult = await this.validateAndUpload(params);

    if (previousFileId) {
      await this.safeDelete(previousFileId);
    }

    return uploadResult;
  }

  /**
   * Direct deletion for manual cleanup or account removal.
   */
  async deleteImage(fileId: string) {
    return await this.storageProvider.delete(fileId);
  }

  private async validateAndUpload(params: UploadParams): Promise<UploadResult> {
    const extension = path.extname(params.fileName).toLowerCase();

    if (!this.allowedExtensions.includes(extension)) {
      throw new BadRequestException(`${extension} is not a supported image format.`);
    }

    // Peek the first bytes without consuming the stream
    const head = await peekStream(params.fileData, MAGIC_PEEK_BYTES);

    const mime = detectMimeType(head);
    if (!mime || !this.allowedMimeTypes.includes(mime)) {
      throw new BadRequestException('The file content is not a valid image.');
    }

    const safeFileName = `${uuidv4()}${extension}`;

    return await this.storageProvider.upload({
      ...params,
      fileName: safeFileName,
    });
  }

  private async safeDelete(fileId: string) {
    try {
      const result = await this.storageProvider.delete(fileId);
      if (!result.success) {
        this.logger.warn(`Orphaned file cleanup failed for ID: ${fileId}`);
      }
    } catch (error) {
      this.logger.error(`Exception during cleanup for ID: ${fileId}`, error);
    }
  }
}
