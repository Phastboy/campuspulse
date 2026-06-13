import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import type { InquiryStatus } from '../../domain/types/inquiry.types.js';

export class CreateInquiryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  businessProfileId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  listingId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  initialMessage!: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class UpdateInquiryStatusDto {
  @ApiProperty({ enum: ['UNREAD', 'READ', 'RESPONDED', 'CLOSED'] })
  @IsEnum(['UNREAD', 'READ', 'RESPONDED', 'CLOSED'] as any)
  status!: InquiryStatus;
}
