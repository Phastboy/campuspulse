import {
  Entity,
  PrimaryKey,
  Property,
  Index,
} from '@mikro-orm/decorators/legacy';
import { IUser } from '@domain/interfaces';

@Entity({ tableName: 'users' })
export class User implements IUser {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuid_generate_v4()' })
  id!: string;

  @Property({ fieldName: 'google_id' })
  @Index()
  googleId!: string;

  @Property()
  @Index()
  email!: string;

  @Property()
  username!: string;

  @Property({ onCreate: () => new Date(), fieldName: 'created_at' })
  createdAt!: Date;
}
