import { NestFactory } from '@nestjs/core';
import {
  INestApplication,
  Logger,
  ValidationPipe,
  ConsoleLogger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

import { AppModule } from '@modules/app.module';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { SwaggerSetup } from '@configs/swagger.config';
import { AppConfig } from '@configs/validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({ json: true, colors: true }),
  });

  const configService = app.get(ConfigService<AppConfig>);

  app.setGlobalPrefix(configService.get('GLOBAL_PREFIX') as string);

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
    Logger.warn('Could not enumerate network interfaces.', 'Bootstrap');
  }

  if (addresses.length > 0) {
    for (const address of addresses) {
      Logger.log(`App is listening at http://${address}:${port}`, 'Bootstrap');
    }
  } else {
    Logger.log(`App is listening on port ${port}`, 'Bootstrap');
  }
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to bootstrap application', err);
  process.exit(1);
});
