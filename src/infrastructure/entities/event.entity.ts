import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { type EventDateTime } from '@common/datetime';
import { IEvent } from '@domain/interfaces';

/**
 * MikroORM entity for the `events` table.
 *
 * Implements {@link IEvent} so the domain interface governs the contract —
 * if this entity ever diverges from what the domain expects, TypeScript
 * catches it at compile time. Infrastructure conforms to domain, never the
 * reverse.
 *
 * The `datetime` field is stored as `jsonb` to accommodate the
 * {@link EventDateTime} discriminated union without separate columns.
 *
 * ⚠️ MikroORM does not hydrate nested `Date` objects inside JSONB.
 * `datetime.date`, `datetime.startTime`, and `datetime.endTime` arrive as
 * ISO strings at runtime. Use {@link getComparableDateFromSummary} when a
 * reliable `Date` is needed.
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
