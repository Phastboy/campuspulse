import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { AppConfig } from './config/validation';

/**
 * Encapsulates Swagger UI registration for the NestJS application.
 *
 * Swagger is opt-in via the `SWAGGER_ENABLED` environment variable.
 * When enabled, the docs and JSON endpoints are protected by HTTP Basic Auth
 * to prevent accidental exposure of the API surface in production.
 *
 * All configuration values are read from the validated {@link AppConfig} so
 * misconfigured environments fail at startup, not at request time.
 *
 * @example
 * // In main.ts after the app is created:
 * SwaggerSetup.register(app, globalPrefix);
 */
export class SwaggerSetup {
  /**
   * Registers Swagger UI on the application if `SWAGGER_ENABLED` is `true`.
   * Does nothing when Swagger is disabled — safe to call unconditionally.
   *
   * @param app - The running NestJS application instance
   * @param globalPrefix - The global route prefix (e.g. `"api"`) — used to
   *   correctly configure paths relative to the app root
   */
  static register(app: INestApplication, globalPrefix: string): void {
    const config = app.get(ConfigService<AppConfig>);

    const enabled = config.get('SWAGGER_ENABLED');
    if (!enabled) return;

    const username = config.get('SWAGGER_USER') as string;
    const password = config.get('SWAGGER_PASS') as string;
    const docsPath = config.get('SWAGGER_PATH_DOCS') as string;
    const jsonPath = config.get('SWAGGER_PATH_JSON') as string;

    // Protect both the UI and the raw JSON spec behind Basic Auth
    app.use(
      [`/${docsPath}`, `/${jsonPath}`],
      basicAuth({
        challenge: true,
        users: { [username]: password },
      }),
    );

    const title = config.get('SWAGGER_TITLE') as string;
    const description = config.get('SWAGGER_DESCRIPTION') as string;
    const version = config.get('SWAGGER_VERSION') as string;
    const tagName = config.get('SWAGGER_TAG_NAME') as string;
    const tagDescription = config.get('SWAGGER_TAG_DESC') as string;
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
      swaggerOptions: { persistAuthorization: true },
    });
  }
}
