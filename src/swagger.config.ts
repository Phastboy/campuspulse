import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';

export class SwaggerSetup {
  static register(app: INestApplication, globalPrefix: string) {
    const config = app.get(ConfigService);

    const enabled = config.get<boolean>('SWAGGER_ENABLED');
    if (!enabled) return;

    const username = config.getOrThrow<string>('SWAGGER_USER');
    const password = config.getOrThrow<string>('SWAGGER_PASS');

    const docsPath = `${globalPrefix}/docs`;
    const jsonPath = `${globalPrefix}/docs-json`;

    app.use(
      [`/${docsPath}`, `/${jsonPath}`],
      basicAuth({
        challenge: true,
        users: {
          [username]: password,
        },
      }),
    );

    const builder = new DocumentBuilder()
      .setTitle('Service API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          name: 'Authorization',
          description: 'Enter JWT token',
        },
        'access-token'
      )
      .build();

    const document = SwaggerModule.createDocument(app, builder);

    SwaggerModule.setup(docsPath, app, document, {
      jsonDocumentUrl: jsonPath,
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }
}
