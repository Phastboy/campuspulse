import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import {
  EventCategory,
  PricingTag,
  LocationTag,
  RsvpStatus,
} from '../entities/event.entity';

export class CreateEventDto {
  @ApiProperty({
    description: 'Event title',
    minLength: 3,
    maxLength: 200,
    example: 'Tech Summit 2026',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Detailed event description',
    example: 'Annual technology summit featuring industry leaders...',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    enum: EventCategory,
    description: 'Event category',
    example: EventCategory.TECH,
  })
  @IsEnum(EventCategory)
  category!: EventCategory;

  @ApiProperty({
    description: 'Event date and time (ISO format)',
    example: '2026-03-20T14:00:00Z',
  })
  @IsDateString()
  date!: string;

  @ApiProperty({
    description: 'Event venue',
    example: 'ACE Conference Hall, OAU',
  })
  @IsString()
  @MinLength(3)
  venue!: string;

  @ApiProperty({
    enum: LocationTag,
    description: 'Location type',
    example: LocationTag.ON_CAMPUS,
  })
  @IsEnum(LocationTag)
  locationTag!: LocationTag;

  @ApiProperty({
    enum: PricingTag,
    description: 'Pricing type',
    example: PricingTag.FREE,
  })
  @IsEnum(PricingTag)
  pricingTag!: PricingTag;

  @ApiPropertyOptional({
    description: 'Detailed pricing information',
    example: 'Free for students, N2000 for non-students',
  })
  @IsString()
  @IsOptional()
  pricingDetail?: string;

  @ApiProperty({
    enum: RsvpStatus,
    description: 'RSVP requirement',
    example: RsvpStatus.REGISTER,
  })
  @IsEnum(RsvpStatus)
  rsvpStatus!: RsvpStatus;

  @ApiPropertyOptional({
    description: 'RSVP/registration link',
    example: 'https://forms.gle/example',
  })
  @IsUrl()
  @IsOptional()
  rsvpLink?: string;

  @ApiPropertyOptional({
    description: 'Contact information',
    example: 'John Doe: 08012345678',
  })
  @IsString()
  @IsOptional()
  contactInfo?: string;

  @ApiPropertyOptional({
    description: 'Organizer name',
    example: 'NACOS OAU',
  })
  @IsString()
  @IsOptional()
  organizer?: string;

  @ApiProperty({
    description: 'Event source',
    example: 'manual',
    default: 'manual',
  })
  @IsString()
  source: string = 'manual';
}
