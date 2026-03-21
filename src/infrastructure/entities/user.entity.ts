import {
  Entity,
  PrimaryKey,
  Property,
  Index,
} from '@mikro-orm/decorators/legacy';
import type { AuthUser } from '@odysseon/auth';

/**
 * Persisted user. Satisfies {@link AuthUser} from `@odysseon/auth`.
 *
 * Phase 2 enables only `google` capability — `password` is always null.
 * Declaring it here means no schema change is needed when credentials auth
 * is added in a future phase.
 */
@Entity({ tableName: 'users' })
export class User implements Partial<AuthUser> {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuid_generate_v4()' })
  id!: string;

  @Property()
  @Index()
  email!: string;

  @Property({ fieldName: 'google_id', nullable: true })
  @Index()
  googleId?: string | null;

  @Property({ nullable: true })
  password?: string | null;

  @Property()
  username!: string;

  @Property({ onCreate: () => new Date(), fieldName: 'created_at' })
  createdAt!: Date;
}
