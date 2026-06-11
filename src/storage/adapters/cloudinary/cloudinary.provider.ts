import { ConfigService } from '@nestjs/config';
import { Provider, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider: Provider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const logger = new Logger('CloudinaryProvider');

    const cloudName = configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = configService.get<string>('CLOUDINARY_API_SECRET');

    logger.log('🔧 Cloudinary Configuration:', {
      cloudName,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
    });

    cloudinary.config({
      ...(cloudName !== undefined && { cloud_name: cloudName }),
      ...(apiKey !== undefined && { api_key: apiKey }),
      ...(apiSecret !== undefined && { api_secret: apiSecret }),
    });

    return cloudinary;
  },
};
