import { NestFactory } from '@nestjs/core';
import {
  INestApplication,
  Logger,
  ValidationPipe,
  ConsoleLogger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SwaggerSetup } from './swagger.config';
import { AppConfig } from './config/validation';

/**
 * Application entry point.
 *
 * Bootstraps the NestJS application, configures global middleware,
 * registers Swagger (if enabled via env), and starts listening.
 *
 * Global setup applied here:
 * - Structured JSON logger via {@link ConsoleLogger}
 * - {@link ValidationPipe} — whitelist, forbid unknown properties, auto-transform
 * - {@link AllExceptionsFilter} — normalised JSON error envelope for all exceptions
 * - {@link SwaggerSetup} — optional basic-auth-protected API docs
 * - CORS enabled (all origins) — tighten in production
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({ json: true, colors: true }),
  });

  const configService = app.get(ConfigService<AppConfig>);

  const globalPrefix = configService.get('GLOBAL_PREFIX') as string;
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  SwaggerSetup.register(app);
  app.enableCors();

  const port = configService.get('PORT') as number;
  await app.listen(port);

  logNetworkAddresses(app, port);
}

/**
 * Logs all non-loopback IPv4 addresses the HTTP server is reachable on.
 * Falls back to a port-only message if network interfaces cannot be enumerated.
 *
 * @param app - The running NestJS application instance
 * @param port - The port the server is bound to
 */
function logNetworkAddresses(app: INestApplication, port: number): void {
  const addresses: string[] = [];

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
  } catch {
    Logger.warn(
      'Could not enumerate network interfaces, skipping address logging.',
      'Bootstrap',
    );
  }

  // NestJS does not expose the protocol directly; default to http in dev
  const protocol =
    (app.getHttpAdapter().getInstance().server?.proto as string | undefined) ??
    'http';

  if (addresses.length > 0) {
    for (const address of addresses) {
      Logger.log(
        `App is listening at ${protocol}://${address}:${port}`,
        'Bootstrap',
      );
    }
  } else {
    Logger.log(
      `App is listening on port ${port} (network addresses unavailable)`,
      'Bootstrap',
    );
  }
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to bootstrap application', err);
  process.exit(1);
});
