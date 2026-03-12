import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { type EventDateTime } from '@common';

@Entity({ tableName: 'events' })
export class Event {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuid_generate_v4()' })
  id!: string;

  @Property()
  title!: string;

  @Property({ type: 'jsonb' })
  datetime!: EventDateTime;

  @Property()
  venue!: string;

  @Property({ nullable: true })
  description?: string;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;
}
