import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerSetup } from './swagger.config';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: true,
      colors: true,
    }),
  });

  const configService = app.get(ConfigService);
  const globalPrefix = configService.get<string>('GLOBAL_PREFIX', 'api');
  app.setGlobalPrefix(globalPrefix);


  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  SwaggerSetup.register(app, globalPrefix);

  // Enable CORS
  app.enableCors();

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logNetwork(app, port);
}

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

  const protocol = app.getHttpAdapter().getInstance().server?.proto || 'http';
  if (addresses.length > 0) {
    addresses.forEach((address) => {
      Logger.log(`App is listening at ${protocol}://${address}:${port}`, 'Bootstrap');
    });
  } else {
    Logger.log(`App is listening on port ${port} (network addresses unavailable)`, 'Bootstrap');
  }
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap application', err);
  process.exit(1);
});
