import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
} from '@mikro-orm/decorators/legacy';
import type { IRefreshToken } from '@odysseon/auth';
import { User } from './user.entity';

/**
 * Persisted refresh token. Implements {@link IRefreshToken} from `@odysseon/auth`.
 *
 * The `token` column stores the SHA-256 hash produced by `CryptoTokenHasher` —
 * the raw token is never persisted. The `userId` scalar allows fast per-user
 * deletes without a join.
 */
@Entity({ tableName: 'refresh_tokens' })
export class RefreshToken implements IRefreshToken {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuid_generate_v4()' })
  id!: string;

  /** SHA-256 hash of the raw opaque refresh token. */
  @Property()
  @Index()
  token!: string;

  /** Denormalised for fast deleteAllForUser without a join. */
  @Property({ fieldName: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { fieldName: 'user_id', persist: false })
  user!: User;

  @Property({ fieldName: 'expires_at' })
  expiresAt!: Date;

  @Property({ onCreate: () => new Date(), fieldName: 'created_at' })
  createdAt!: Date;
}
