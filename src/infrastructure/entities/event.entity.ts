import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { type EventDateTime } from '@domain/value-objects';
import { IEvent } from '@domain/interfaces';

@Entity({ tableName: 'events' })
export class Event implements IEvent {
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

  @Property({ type: 'uuid', nullable: true, fieldName: 'created_by' })
  createdBy!: string | null;

  @Property({ onCreate: () => new Date(), fieldName: 'created_at' })
  createdAt!: Date;
}
