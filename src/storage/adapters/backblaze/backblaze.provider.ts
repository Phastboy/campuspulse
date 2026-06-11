import { ConfigService } from '@nestjs/config';
import { Provider, Logger } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

export const BACKBLAZE_CLIENT = 'BACKBLAZE_CLIENT';
export const BACKBLAZE_CONFIG = 'BACKBLAZE_CONFIG';

export interface BackblazeConfig {
  bucketName: string;
  endpoint: string;
  publicUrlBase?: string;
}

export const BackblazeClientProvider: Provider = {
  provide: BACKBLAZE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): S3Client => {
    const logger = new Logger('BackblazeClientProvider');

    const endpoint = configService.getOrThrow<string>('B2_ENDPOINT');
    const region = configService.getOrThrow<string>('B2_REGION');
    const accessKeyId = configService.getOrThrow<string>('B2_APPLICATION_KEY_ID');
    const secretAccessKey = configService.getOrThrow<string>('B2_APPLICATION_KEY');

    const formattedEndpoint =
      !endpoint.startsWith('http://') && !endpoint.startsWith('https://')
        ? `https://${endpoint}`
        : endpoint;

    logger.log('🔧 Backblaze B2 Configuration:', {
      endpoint: formattedEndpoint,
      region,
      bucketName: configService.get<string>('B2_BUCKET_NAME'),
      hasKeyId: !!accessKeyId,
      hasSecretKey: !!secretAccessKey,
    });

    return new S3Client({
      endpoint: formattedEndpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  },
};

export const BackblazeConfigProvider: Provider = {
  provide: BACKBLAZE_CONFIG,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): BackblazeConfig => {
    let endpoint = configService.get<string>('B2_ENDPOINT', '');

    if (endpoint && !endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      endpoint = `https://${endpoint}`;
    }

    const publicUrlBase = configService.get<string>('B2_PUBLIC_URL_BASE');

    return {
      bucketName: configService.get<string>('B2_BUCKET_NAME', ''),
      endpoint,
      ...(publicUrlBase !== undefined && { publicUrlBase }),
    };
  },
};
