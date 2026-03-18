/**
 * Port for refresh token persistence.
 *
 * True rotation: each use deletes the old record and the caller issues a new one.
 * Replaying an old refresh token finds no valid record and is rejected.
 */
export interface IRefreshTokenStore {
  save(userId: string, jti: string, expiresAt: Date): Promise<void>;
  findValid(jti: string): Promise<{ userId: string } | null>;
  delete(jti: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}

export const REFRESH_TOKEN_STORE = 'REFRESH_TOKEN_STORE' as const;
