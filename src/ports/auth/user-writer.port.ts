import { IUser } from '@domain/interfaces';

export interface IUserWriter {
  create(data: { googleId: string; email: string; username: string }): Promise<IUser>;
}

export const USER_WRITER = 'USER_WRITER' as const;
