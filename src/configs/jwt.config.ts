import { readFileSync } from 'fs';
import { resolve } from 'path';

export const JWT_ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes
export const JWT_REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Loads the ES256 key pair from `keys/` at the project root.
 * Fails fast at startup if either file is missing.
 * Run `pnpm keys:generate` to create them.
 */
export function loadJwtKeys(): { privateKey: string; publicKey: string } {
  const root = resolve(process.cwd());
  try {
    return {
      privateKey: readFileSync(resolve(root, 'keys', 'private.pem'), 'utf8'),
      publicKey: readFileSync(resolve(root, 'keys', 'public.pem'), 'utf8'),
    };
  } catch (err) {
    throw new Error(
      `JWT key files not found. Run \`pnpm keys:generate\`.\n` +
        `Expected: keys/private.pem and keys/public.pem`,
      { cause: err },
    );
  }
}
