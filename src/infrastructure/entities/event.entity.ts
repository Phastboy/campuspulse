import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { type EventDateTime } from '@domain/value-objects';
import { IEvent } from '@domain/interfaces';

/**
 * MikroORM entity for the `events` table.
 *
 * Implements {@link IEvent} — the domain interface governs the contract.
 * Infrastructure conforms to domain, never the reverse.
 *
 * ⚠️ MikroORM does not hydrate nested `Date` objects inside JSONB.
 * `datetime.date`, `datetime.startTime`, and `datetime.endTime` may arrive
 * as ISO strings at runtime. Use {@link getComparableDateFromSummary} when
 * a reliable `Date` is needed.
 */
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

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;
}
