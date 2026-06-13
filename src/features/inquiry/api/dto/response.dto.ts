import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { InquiryStatus } from '../../domain/types/inquiry.types.js';
import { InquiryView, InquiryMessageView } from '../../domain/types/inquiry.types.js';

export class InquiryMessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  inquiryId!: string;

  @ApiProperty()
  senderId!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  createdAt!: Date;

  static from(message: InquiryMessageView): InquiryMessageResponseDto {
    const dto = new InquiryMessageResponseDto();
    Object.assign(dto, message);
    return dto;
  }
}

export class InquiryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  businessProfileId!: string;

  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional()
  listingId!: string | null;

  @ApiPropertyOptional()
  subject!: string | null;

  @ApiProperty({ enum: ['UNREAD', 'READ', 'RESPONDED', 'CLOSED'] })
  status!: InquiryStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: [InquiryMessageResponseDto] })
  messages?: InquiryMessageResponseDto[];

  static from(inquiry: InquiryView, messages?: InquiryMessageView[]): InquiryResponseDto {
    const dto = new InquiryResponseDto();
    Object.assign(dto, inquiry);
    if (messages) {
      dto.messages = messages.map((m) => InquiryMessageResponseDto.from(m));
    }
    return dto;
  }
}
