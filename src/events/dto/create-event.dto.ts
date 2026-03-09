import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
  IsNotEmpty
} from 'class-validator';
import type { EventCategory, PricingTag, LocationTag, RSVPStatus } from '../entities/event.entity';

export class CreateEventDto {
  @ApiProperty({
    description: 'Event title',
    minLength: 3,
    maxLength: 200,
    example: 'Tech Summit 2026'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Detailed event description',
    example: 'Annual technology summit featuring industry leaders...'
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    enum: ['tech', 'academic', 'entertainment', 'sports', 'welfare', 'online', 'other'],
    description: 'Event category',
    example: 'tech'
  })
  @IsEnum(['tech', 'academic', 'entertainment', 'sports', 'welfare', 'online', 'other'])
  category!: EventCategory;

  @ApiProperty({
    description: 'Event date and time (ISO format)',
    example: '2026-03-20T14:00:00Z'
  })
  @IsDateString()
  date!: string;

  @ApiProperty({
    description: 'Event venue',
    example: 'ACE Conference Hall, OAU'
  })
  @IsString()
  @MinLength(3)
  venue!: string;

  @ApiProperty({
    enum: ['on-campus', 'off-campus', 'online'],
    description: 'Location type',
    example: 'on-campus'
  })
  @IsEnum(['on-campus', 'off-campus', 'online'])
  locationTag!: LocationTag;

  @ApiProperty({
    enum: ['free', 'paid', 'conditional'],
    description: 'Pricing type',
    example: 'free'
  })
  @IsEnum(['free', 'paid', 'conditional'])
  pricingTag!: PricingTag;

  @ApiPropertyOptional({
    description: 'Detailed pricing information',
    example: 'Free for students, N2000 for non-students'
  })
  @IsString()
  @IsOptional()
  pricingDetail?: string;

  @ApiProperty({
    enum: ['open-entry', 'register', 'buy-ticket'],
    description: 'RSVP requirement',
    example: 'register'
  })
  @IsEnum(['open-entry', 'register', 'buy-ticket'])
  rsvpStatus!: RSVPStatus;

  @ApiPropertyOptional({
    description: 'RSVP/registration link',
    example: 'https://forms.gle/example'
  })
  @IsUrl()
  @IsOptional()
  rsvpLink?: string;

  @ApiPropertyOptional({
    description: 'Contact information',
    example: 'John Doe: 08012345678'
  })
  @IsString()
  @IsOptional()
  contactInfo?: string;

  @ApiPropertyOptional({
    description: 'Organizer name',
    example: 'NACOS OAU'
  })
  @IsString()
  @IsOptional()
  organizer?: string;

  @ApiProperty({
    description: 'Event source',
    example: 'manual',
    default: 'manual'
  })
  @IsString()
  source: string = 'manual';
}
