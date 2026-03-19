import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { AppConfig } from './validation';

/**
 * Encapsulates Swagger UI registration.
 *
 * Swagger is opt-in via `SWAGGER_ENABLED`. When enabled, the docs and JSON
 * endpoints are protected by HTTP Basic Auth.
 */
export class SwaggerSetup {
  static register(app: INestApplication): void {
    const config = app.get(ConfigService<AppConfig>);
    const enabled = config.get<boolean>('SWAGGER_ENABLED');
    if (!enabled) return;

    const username = config.get('SWAGGER_USER') as string;
    const password = config.get('SWAGGER_PASS') as string;
    const docsPath = config.get('SWAGGER_PATH_DOCS') as string;
    const jsonPath = config.get('SWAGGER_PATH_JSON') as string;

    app.use(
      [`/${docsPath}`, `/${jsonPath}`],
      basicAuth({ challenge: true, users: { [username]: password } }),
    );

    const builder = new DocumentBuilder()
      .setTitle(config.get('SWAGGER_TITLE') as string)
      .setDescription(config.get('SWAGGER_DESCRIPTION') as string)
      .setVersion(config.get('SWAGGER_VERSION') as string)
      .addTag(
        config.get('SWAGGER_TAG_NAME') as string,
        config.get('SWAGGER_TAG_DESC') as string,
      )
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, builder);
    SwaggerModule.setup(docsPath, app, document, {
      jsonDocumentUrl: jsonPath,
      swaggerOptions: { persistAuthorization: true },
    });
  }
}
