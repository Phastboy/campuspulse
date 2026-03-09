import { NestFactory } from '@nestjs/core';
import { INestApplication, Logger, ValidationPipe, ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SwaggerSetup } from './swagger.config';

async function bootstrap() {
  // Create app with structured logger
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({ json: true, colors: true }),
  });

  const configService = app.get(ConfigService);

  // Set global prefix from config (default 'api')
  const globalPrefix = configService.get<string>('GLOBAL_PREFIX', 'api');
  app.setGlobalPrefix(globalPrefix);

  // Global validation pipe for all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                 // remove unknown properties
      forbidNonWhitelisted: true,      // throw error on unknown properties
      transform: true,                 // auto-transform payloads to DTO instances
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger setup
  SwaggerSetup.register(app, globalPrefix);

  // Enable CORS for all routes
  app.enableCors();

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logNetwork(app, port);
}

/**
 * Logs the network addresses the app is listening on
 */
function logNetwork(app: INestApplication, port: number) {
  let addresses: string[] = [];
  try {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
      if (!iface) continue;
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          addresses.push(alias.address);
        }
      }
    }
  } catch (err) {
    Logger.warn('Could not enumerate network interfaces, skipping logging addresses.', 'Bootstrap');
  }

  // Default protocol is http
  const protocol = (app.getHttpAdapter().getInstance().server?.proto as string) || 'http';
  if (addresses.length > 0) {
    addresses.forEach((address) => {
      Logger.log(`App is listening at ${protocol}://${address}:${port}`, 'Bootstrap');
    });
  } else {
    Logger.log(`App is listening on port ${port} (network addresses unavailable)`, 'Bootstrap');
  }
}

// Catch any bootstrap errors
bootstrap().catch((err) => {
  console.error('Failed to bootstrap application', err);
  process.exit(1);
});
