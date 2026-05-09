import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';
import * as path from 'path';
import { CLOUDINARY } from './cloudinary.provider.js';
import {
  StorageProvider,
  UploadParams,
  UploadResult,
  DeleteResult,
} from '../../ports/provider.port.js';

@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  constructor(@Inject(CLOUDINARY) private readonly cloudinary: typeof Cloudinary) {}

  async upload(params: UploadParams): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const publicIdBase = path.parse(params.fileName).name;

      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          public_id: publicIdBase,
          folder: params.destination,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error('Cloudinary Upload Error:', error);
            return reject(new InternalServerErrorException('Failed to upload image.'));
          }

          this.logger.log(`Uploaded image to Cloudinary: ${result.public_id}`);

          resolve({
            url: result.secure_url,
            fileId: result.public_id,
          });
        },
      );

      params.fileData.pipe(uploadStream);
    });
  }

  async delete(fileId: string): Promise<DeleteResult> {
    try {
      await this.cloudinary.uploader.destroy(fileId);
      this.logger.log(`Deleted image from Cloudinary: ${fileId}`);

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown storage error';

      this.logger.error('Cloudinary Delete Error:', error);

      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}
