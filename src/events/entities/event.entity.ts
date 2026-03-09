import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  Index,
  BeforeCreate,
  BeforeUpdate
} from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

export type EventCategory = 'tech' | 'academic' | 'entertainment' | 'sports' | 'welfare' | 'online' | 'other';
export type PricingTag = 'free' | 'paid' | 'conditional';
export type LocationTag = 'on-campus' | 'off-campus' | 'online';
export type RSVPStatus = 'open-entry' | 'register' | 'buy-ticket';
export type EventStatus = 'pending' | 'live' | 'cancelled' | 'postponed';

@Entity()
@Index({ properties: ['date', 'status'] })
@Index({ properties: ['category', 'date'] })
export class Event {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuid_generate_v4()' })
  @ApiProperty({ description: 'Unique event identifier' })
  id!: string;

  @Property({ length: 200 })
  @ApiProperty({ description: 'Event title', maxLength: 200 })
  title!: string;

  @Property({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Detailed event description', required: false })
  description?: string;

  @Enum(() => ['tech', 'academic', 'entertainment', 'sports', 'welfare', 'online', 'other'])
  @ApiProperty({
    enum: ['tech', 'academic', 'entertainment', 'sports', 'welfare', 'online', 'other'],
    description: 'Event category'
  })
  category!: EventCategory;

  @Property()
  @ApiProperty({ description: 'Event date and time', example: '2026-03-20T14:00:00Z' })
  date!: Date;

  @Property()
  @ApiProperty({ description: 'Event venue/location' })
  venue!: string;

  @Enum(() => ['on-campus', 'off-campus', 'online'])
  @ApiProperty({
    enum: ['on-campus', 'off-campus', 'online'],
    description: 'Location type'
  })
  locationTag!: LocationTag;

  @Enum(() => ['free', 'paid', 'conditional'])
  @ApiProperty({
    enum: ['free', 'paid', 'conditional'],
    description: 'Pricing type'
  })
  pricingTag!: PricingTag;

  @Property({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Detailed pricing information', required: false })
  pricingDetail?: string;

  @Enum(() => ['open-entry', 'register', 'buy-ticket'])
  @ApiProperty({
    enum: ['open-entry', 'register', 'buy-ticket'],
    description: 'RSVP requirement type'
  })
  rsvpStatus!: RSVPStatus;

  @Property({ nullable: true })
  @ApiProperty({ description: 'RSVP/registration link', required: false })
  rsvpLink?: string;

  @Property({ nullable: true })
  @ApiProperty({ description: 'Contact information', required: false })
  contactInfo?: string;

  @Property({ nullable: true })
  @ApiProperty({ description: 'Organizer name', required: false })
  organizer?: string;

  @Property()
  @ApiProperty({ description: 'Source of the event (manual, crowdsourced, etc.)' })
  source!: string;

  @Enum(() => ['pending', 'live', 'cancelled', 'postponed'])
  @ApiProperty({
    enum: ['pending', 'live', 'cancelled', 'postponed'],
    description: 'Event status',
    default: 'pending'
  })
  status: EventStatus = 'pending';

  @Property({ onCreate: () => new Date() })
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date = new Date();

  @BeforeCreate()
  @BeforeUpdate()
  validateDates() {
    if (this.date < new Date()) {
      throw new Error('Event date cannot be in the past');
    }
  }
}
