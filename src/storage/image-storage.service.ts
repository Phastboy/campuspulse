import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageProvider, UploadParams, UploadResult } from './ports/provider.port.js';

/**
 * Utility to verify file integrity via magic numbers (byte checking).
 */
function detectMimeType(buf: Buffer): string | undefined {
  if (buf.length < 4) return undefined;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return 'image/webp';
  return undefined;
}

@Injectable()
export class ImageStorageService {
  private readonly logger = new Logger(ImageStorageService.name);
  private readonly allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  private readonly allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

  constructor(private readonly storageProvider: StorageProvider) {}

  /**
   * Orchestrates a safe image replacement.
   * It validates and uploads the new file first, then triggers a cleanup of the old file.
   */
  async replaceImage(params: UploadParams, previousFileId?: string): Promise<UploadResult> {
    // Validate and execute the new upload
    const uploadResult = await this.validateAndUpload(params);

    //  Safely attempt to clean up the old file if an ID was provided
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

    // Validate extension
    if (!this.allowedExtensions.includes(extension)) {
      throw new BadRequestException(`${extension} is not a supported image format.`);
    }

    // Validate content integrity (Magic Numbers)
    const mime = detectMimeType(params.fileData);
    if (!mime || !this.allowedMimeTypes.includes(mime)) {
      throw new BadRequestException('The file content is not a valid image.');
    }

    // Generate internal safe name while maintaining the original extension
    const safeFileName = `${uuidv4()}${extension}`;

    // Delegate to the provider port
    return await this.storageProvider.upload({
      ...params,
      fileName: safeFileName,
    });
  }

  /**
   * Internal cleanup that swallows errors to prevent infrastructure
   * failures from interrupting the main application flow.
   */
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
