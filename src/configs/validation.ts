import { z } from 'zod';

export const configSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    GLOBAL_PREFIX: z.string().default('api'),
    DATABASE_URL: z.string().url(),
    FRONTEND_URL: z.string().url().default('https://pulse.app'),

    // ── Receipt Secret ────────────────────────────────────────────────────
    RECEIPT_SECRET: z.string().min(32),

    // ── Mailer ────────────────────────────────────────────────────────────
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),

    // ── Redis ─────────────────────────────────────────────────────────────
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),

    // ── Swagger ───────────────────────────────────────────────────────────
    SWAGGER_ENABLED: z.coerce.boolean().default(false),
    SWAGGER_USER: z.string().optional(),
    SWAGGER_PASS: z.string().optional(),
    SWAGGER_PATH_DOCS: z.string().default('api/docs'),
    SWAGGER_PATH_JSON: z.string().default('api/docs-json'),
    SWAGGER_TITLE: z.string().default('Pulse API'),
    SWAGGER_DESCRIPTION: z.string().default('Discovery-first commercial visibility platform API'),
    SWAGGER_VERSION: z.string().default('1.0'),
    SWAGGER_TAG_NAME: z.string().default('events'),
    SWAGGER_TAG_DESC: z.string().default('Event management endpoints'),
  })
  .refine((d) => !d.SWAGGER_ENABLED || (!!d.SWAGGER_USER && !!d.SWAGGER_PASS), {
    message: 'SWAGGER_USER and SWAGGER_PASS are required when SWAGGER_ENABLED is true',
    path: ['SWAGGER_ENABLED'],
  });

export type AppConfig = z.infer<typeof configSchema>;

export function validateConfig(config: Record<string, unknown>): AppConfig {
  try {
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const msg = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
      throw new Error(`Configuration validation failed:\n${msg}`, {
        cause: error,
      });
    }
    throw error;
  }
}
