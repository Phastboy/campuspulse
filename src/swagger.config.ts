import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { AppConfig } from './config/validation';

export class SwaggerSetup {
  static register(app: INestApplication, globalPrefix: string) {
    const config = app.get(ConfigService<AppConfig>);

    // Enable/disable Swagger
    const enabled = config.get('SWAGGER_ENABLED');
    if (!enabled) return;

    const username = config.get('SWAGGER_USER') as string;
    const password = config.get('SWAGGER_PASS') as string;

    // Paths
    const docsPath = config.get('SWAGGER_PATH_DOCS');
    const jsonPath = config.get('SWAGGER_PATH_JSON');

    // Apply Basic Auth
    app.use(
      [`/${docsPath}`, `/${jsonPath}`],
      basicAuth({
        challenge: true,
        users: { [username]: password },
      }),
    );

    // API Metadata
    const title = config.get('SWAGGER_TITLE');
    const description = config.get('SWAGGER_DESCRIPTION');
    const version = config.get('SWAGGER_VERSION');
    const tagName = config.get('SWAGGER_TAG_NAME');
    const tagDescription = config.get('SWAGGER_TAG_DESC');

    // Security scheme name - guaranteed to exist when enabled
    const securityName = config.get('SWAGGER_SECURITY_NAME') as string;

    const builder = new DocumentBuilder()
      .setTitle(title)
      .setDescription(description)
      .setVersion(version)
      .addTag(tagName, tagDescription)
      .addBearerAuth(
        {
          type: 'http',
          name: 'Authorization',
          description: 'Enter JWT token',
        },
        securityName,
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
