import { IUser } from '@domain/interfaces';

export interface IUserReader {
  findById(id: string): Promise<IUser | null>;
  findByGoogleId(googleId: string): Promise<IUser | null>;
}

export const USER_READER = 'USER_READER' as const;
