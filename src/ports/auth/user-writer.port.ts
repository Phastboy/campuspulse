import { IUser } from '@domain/interfaces';

export interface IUserWriter {
  /**
   * Inserts a new user or returns the existing one if `googleId` already
   * exists (ON CONFLICT DO NOTHING + re-fetch). Safe under concurrent
   * requests because the uniqueness invariant is enforced at the DB level.
   */
  upsert(data: {
    googleId: string;
    email: string;
    username: string;
  }): Promise<IUser>;
}

export const USER_WRITER = 'USER_WRITER' as const;
