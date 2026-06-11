import { DynamicModule, Module, Global, Logger, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import 'dotenv/config';

// Port & Application Service
import { StorageProvider } from './ports/provider.port.js';
import { MediaStorageService } from './media-storage.service.js';

import { CloudinaryProvider } from './adapters/cloudinary/cloudinary.provider.js';
import { CloudinaryStorageProvider } from './adapters/cloudinary/cloudinary.adapter.js';

import {
  BackblazeClientProvider,
  BackblazeConfigProvider,
} from './adapters/backblaze/backblaze.provider.js';
import { BackblazeStorageProvider } from './adapters/backblaze/backblaze.adapter.js';

// No-op storage provider for development/testing when no provider is configured
class NoopStorageProvider implements StorageProvider {
  private readonly logger = new Logger(NoopStorageProvider.name);

  async upload(): Promise<{ url: string; fileId: string }> {
    this.logger.warn('NoopStorageProvider.upload() called - returning placeholder');
    return Promise.resolve({ url: 'noop://placeholder', fileId: 'noop-placeholder' });
  }

  async delete(): Promise<{ success: boolean; message?: string }> {
    this.logger.warn('NoopStorageProvider.delete() called - no-op');
    return Promise.resolve({ success: true });
  }
}

@Global()
@Module({
  imports: [ConfigModule],
})
export class StorageModule {
  static register(): DynamicModule {
    const logger = new Logger('StorageModule');

    // Evaluate the environment before DI resolves
    const activeProvider = process.env['STORAGE_PROVIDER']?.toLowerCase();
    const isProduction = process.env['NODE_ENV'] === 'production';

    // The ImageStorageService is always required
    const providers: Provider[] = [MediaStorageService];

    logger.log(`📦 Bootstrapping Storage Module. Active Provider: ${activeProvider ?? 'UNSET'}`);

    if (activeProvider === 'cloudinary') {
      providers.push(CloudinaryProvider, CloudinaryStorageProvider, {
        provide: StorageProvider,
        useExisting: CloudinaryStorageProvider,
      });
    } else if (activeProvider === 'backblaze') {
      // Validate Backblaze config early
      const requiredKeys = [
        'B2_ENDPOINT',
        'B2_REGION',
        'B2_APPLICATION_KEY_ID',
        'B2_APPLICATION_KEY',
        'B2_BUCKET_NAME',
      ];
      const missing = requiredKeys.filter((key) => !process.env[key]);

      if (missing.length > 0) {
        if (isProduction) {
          throw new Error(
            `CRITICAL: Missing Backblaze configuration: ${missing.join(', ')}. ` +
              `Required for production with STORAGE_PROVIDER=backblaze.`,
          );
        }
        logger.warn(
          `⚠️  Missing Backblaze configuration: ${missing.join(', ')}. ` +
            `Falling back to NoopStorageProvider for development.`,
        );
        providers.push({
          provide: StorageProvider,
          useClass: NoopStorageProvider,
        });
      } else {
        providers.push(BackblazeConfigProvider, BackblazeClientProvider, BackblazeStorageProvider, {
          provide: StorageProvider,
          useExisting: BackblazeStorageProvider,
        });
      }
    } else {
      if (isProduction) {
        throw new Error(
          'CRITICAL: Invalid or missing STORAGE_PROVIDER environment variable. ' +
            'Must be "cloudinary" or "backblaze" in production.',
        );
      }
      logger.warn(
        `⚠️  No valid STORAGE_PROVIDER configured. ` +
          `Using NoopStorageProvider for development. ` +
          `Set STORAGE_PROVIDER=cloudinary or backblaze with proper credentials.`,
      );
      providers.push({
        provide: StorageProvider,
        useClass: NoopStorageProvider,
      });
    }

    return {
      module: StorageModule,
      providers: providers,
      exports: [MediaStorageService, StorageProvider],
    };
  }
}
