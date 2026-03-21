import { z } from 'zod';

export const configSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    GLOBAL_PREFIX: z.string().default('api'),
    DATABASE_URL: z.string().url(),

    // ── Google OAuth ──────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CALLBACK_URL: z.string().url(),

    // ── JWT (asymmetric ES256) ────────────────────────────────────────────
    // On Render: add key files under /etc/secrets/ and set these vars to
    // the full PEM content (including header/footer lines).
    JWT_PRIVATE_KEY: z.string().min(1),
    JWT_PUBLIC_KEY: z.string().min(1),

    // ── Swagger ───────────────────────────────────────────────────────────
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
    // SWAGGER_SECURITY_NAME removed — addBearerAuth() uses built-in defaults
  })
  .refine((d) => !d.SWAGGER_ENABLED || (!!d.SWAGGER_USER && !!d.SWAGGER_PASS), {
    message:
      'SWAGGER_USER and SWAGGER_PASS are required when SWAGGER_ENABLED is true',
    path: ['SWAGGER_ENABLED'],
  });

export type AppConfig = z.infer<typeof configSchema>;

export function validateConfig(config: Record<string, unknown>): AppConfig {
  try {
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const msg = error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('\n');
      throw new Error(`Configuration validation failed:\n${msg}`, {
        cause: error,
      });
    }
    throw error;
  }
}
