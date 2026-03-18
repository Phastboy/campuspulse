/**
 * Payload embedded in a CampusPulse access token.
 * Intentionally minimal — only the user ID. No email, no role.
 */
export interface AccessTokenPayload {
  /** JWT subject — the user's UUID. */
  sub: string;
}

/**
 * Payload embedded in a CampusPulse refresh token.
 * Carries the token's own ID (`jti`) so it can be invalidated individually.
 */
export interface RefreshTokenPayload {
  sub: string;
  /** JWT ID — links to the refresh_tokens database record. */
  jti: string;
}
