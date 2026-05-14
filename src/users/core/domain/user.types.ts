export type PlatformRole = 'USER' | 'MODERATOR' | 'ADMIN';

export interface UserEntity {
  id: string;
  accountId: string;
  name: string;
  role: PlatformRole;
  avatarUrl: string | null;
  avatarId: string | null;
}
