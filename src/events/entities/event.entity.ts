import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  Index,
  Unique,
  BeforeCreate,
  BeforeUpdate,
} from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import slugify from 'slugify';
import crypto from 'crypto';

import {
  EventCategory,
  EventStatus,
  LocationTag,
  PricingTag,
  RsvpStatus,
} from '../../common/enums';
export * from '../../common/enums';

@Entity({ tableName: 'events' })
@Index({ properties: ['status', 'date'] }) // upcoming events
@Index({ properties: ['category', 'date'] }) // category browsing
@Index({ properties: ['deletedAt'] }) // soft delete queries
@Index({ properties: ['date', 'views'] }) // trending / homepage
@Unique({ properties: ['date', 'venue', 'category'] }) // deduplication
export class Event {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuid_generate_v4()' })
  @ApiProperty({ description: 'Unique event identifier' })
  id!: string;

  @Property({ unique: true })
  @ApiProperty({ description: 'SEO friendly event slug' })
  slug!: string;

  @Property({ length: 200 })
  @ApiProperty({ description: 'Event title', maxLength: 200 })
  title!: string;

  @Property({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Detailed event description', required: false })
  description?: string;

  @Enum(() => EventCategory)
  @ApiProperty({ enum: EventCategory, description: 'Event category' })
  category!: EventCategory;

  @Property()
  @ApiProperty({
    description: 'Event date and time',
    example: '2026-03-20T14:00:00Z',
  })
  date!: Date;

  @Property()
  @ApiProperty({ description: 'Event venue/location' })
  venue!: string;

  @Enum(() => LocationTag)
  @ApiProperty({ enum: LocationTag, description: 'Location type' })
  locationTag!: LocationTag;

  @Enum(() => PricingTag)
  @ApiProperty({ enum: PricingTag, description: 'Pricing type' })
  pricingTag!: PricingTag;

  @Property({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Detailed pricing information', required: false })
  pricingDetail?: string;

  @Enum(() => RsvpStatus)
  @ApiProperty({ enum: RsvpStatus, description: 'RSVP requirement type' })
  rsvpStatus!: RsvpStatus;

  @Property({ nullable: true })
  @ApiProperty({ description: 'RSVP/registration link', required: false })
  rsvpLink?: string;

  @Property({ nullable: true })
  @ApiProperty({ description: 'Contact information', required: false })
  contactInfo?: string;

  @Property({ nullable: true })
  @ApiProperty({ description: 'Organizer name', required: false })
  organizer?: string;

  @Property({ nullable: true })
  @ApiProperty({ description: 'Cover image URL', required: false })
  coverImageUrl?: string;

  @Property()
  @ApiProperty({
    description: 'Source of the event (manual, crowdsourced, etc.)',
  })
  source!: string;

  @Property({ unique: true })
  @ApiProperty({ description: 'Fingerprint for deduplication' })
  fingerprint!: string;

  @Enum(() => EventStatus)
  @ApiProperty({
    enum: EventStatus,
    description: 'Event status',
    default: EventStatus.LIVE,
  })
  status: EventStatus = EventStatus.LIVE;

  @Property({ default: 0 })
  @ApiProperty({ description: 'Number of views' })
  views: number = 0;

  @Property({ onCreate: () => new Date() })
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date = new Date();

  @Property({ nullable: true })
  @ApiProperty({ description: 'Soft delete timestamp', required: false })
  deletedAt?: Date;

  /**
   * Normalize venue, generate slug and deduplication fingerprint
   */
  @BeforeCreate()
  generateMetadata() {
    this.venue = this.venue.trim().toLowerCase().replace(/\s+/g, ' ');
    this.slug = slugify(this.title, { lower: true, strict: true });

    // Deduplication fingerprint: date + venue
    const raw = [this.date.toISOString(), this.venue].join('|');
    this.fingerprint = crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Validate that the event date is not in the past
   */
  @BeforeCreate()
  @BeforeUpdate()
  validateDates() {
    if (this.date < new Date()) {
      throw new Error('Event date and time cannot be in the past');
    }
  }
}
