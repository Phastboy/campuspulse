import { z } from 'zod';

/**
 * Zod schema for all required and optional environment variables.
 *
 * Validated at application startup via {@link validateConfig}. Any missing
 * required variable or invalid value causes an immediate startup failure with
 * a descriptive error message — misconfiguration is caught before the server
 * accepts requests.
 *
 * Swagger variables are conditionally required: when `SWAGGER_ENABLED=true`,
 * `SWAGGER_USER`, `SWAGGER_PASS`, and `SWAGGER_SECURITY_NAME` must all be set.
 */
export const configSchema = z
  .object({
    // ── Server ────────────────────────────────────────────────────────────
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    GLOBAL_PREFIX: z.string().default('api'),

    // ── Database ──────────────────────────────────────────────────────────
    /** Full PostgreSQL connection string, including credentials and database name. */
    DATABASE_URL: z.string().url(),

    // ── Swagger ───────────────────────────────────────────────────────────
    /** Set to `true` to enable the Swagger UI. Requires auth fields below. */
    SWAGGER_ENABLED: z.coerce.boolean().default(false),
    SWAGGER_USER: z.string().optional(),
    SWAGGER_PASS: z.string().optional(),
    SWAGGER_PATH_DOCS: z.string().default('api/docs'),
    SWAGGER_PATH_JSON: z.string().default('api/docs-json'),
    SWAGGER_TITLE: z.string().default('CampusPulse API'),
    SWAGGER_DESCRIPTION: z
      .string()
      .default('Campus Event Aggregation Platform API'),
    SWAGGER_VERSION: z.string().default('1.0'),
    SWAGGER_TAG_NAME: z.string().default('events'),
    SWAGGER_TAG_DESC: z.string().default('Event management endpoints'),
    SWAGGER_SECURITY_NAME: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.SWAGGER_ENABLED) {
        return (
          !!data.SWAGGER_USER &&
          !!data.SWAGGER_PASS &&
          !!data.SWAGGER_SECURITY_NAME
        );
      }
      return true;
    },
    {
      message:
        'SWAGGER_USER, SWAGGER_PASS, and SWAGGER_SECURITY_NAME are required when SWAGGER_ENABLED is true',
      path: ['SWAGGER_ENABLED'],
    },
  );

/** Typed application configuration inferred from {@link configSchema}. */
export type AppConfig = z.infer<typeof configSchema>;

/**
 * Validates raw environment variables against {@link configSchema}.
 *
 * Intended for use as the `validate` option in `ConfigModule.forRoot()`.
 * Throws a descriptive `Error` on the first validation failure so the
 * process exits immediately with a useful message.
 *
 * @param config - Raw environment variable map from NestJS `ConfigModule`
 * @returns Parsed and typed configuration object
 * @throws {Error} When any required variable is missing or any value is invalid
 */
export function validateConfig(config: Record<string, unknown>): AppConfig {
  try {
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n');

      throw new Error(`Configuration validation failed:\n${formattedErrors}`, {
        cause: error,
      });
    }
    throw error;
  }
}
