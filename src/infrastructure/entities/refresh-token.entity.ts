import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
} from '@mikro-orm/decorators/legacy';
import { User } from './user.entity';

@Entity({ tableName: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuid_generate_v4()' })
  id!: string;

  @Property()
  @Index()
  jti!: string;

  @ManyToOne(() => User, { fieldName: 'user_id' })
  user!: User;

  @Property({ fieldName: 'expires_at' })
  expiresAt!: Date;

  @Property({ onCreate: () => new Date(), fieldName: 'created_at' })
  createdAt!: Date;
}
