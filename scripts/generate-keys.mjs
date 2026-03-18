#!/usr/bin/env node
/**
 * Generates an ES256 (P-256 ECDSA) key pair and writes PEM files to keys/.
 *
 * Run once before starting the application:
 *   pnpm keys:generate
 *
 * keys/private.pem  — signs access and refresh tokens. Keep secret.
 * keys/public.pem   — verifies signatures. Safe to distribute.
 *
 * Rotating keys invalidates all existing refresh tokens — users will need
 * to log in again.
 */

import { generateKeyPairSync } from 'crypto';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root    = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const keysDir = resolve(root, 'keys');

if (!existsSync(keysDir)) {
  mkdirSync(keysDir, { mode: 0o700 });
  console.log('Created keys/');
}

const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
});

writeFileSync(resolve(keysDir, 'private.pem'), privateKey, { mode: 0o600 });
writeFileSync(resolve(keysDir, 'public.pem'),  publicKey,  { mode: 0o644 });

console.log('✓  keys/private.pem');
console.log('✓  keys/public.pem');
console.log('');
console.log('Rotating keys invalidates all active refresh tokens.');
