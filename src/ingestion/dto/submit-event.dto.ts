import { EventDateTime } from '@common';
import { EventSubmission } from '@events/domain';
import { IsString, IsOptional, IsDateString, ValidateIf } from 'class-validator';

export class SubmitEventDto {
  @IsString()
  title!: string;

  @IsString()
  type!: 'specific' | 'all-day';

  @IsDateString()
  date!: string;


  @ValidateIf(o => o.type === 'specific')
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ValidateIf(o => o.type === 'all-day')
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsString()
  venue!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export function mapDtoToEventSubmission(dto: SubmitEventDto): EventSubmission {
  let datetime: EventDateTime;

  if (dto.type === 'specific') {
    datetime = {
      type: 'specific',
      date: new Date(dto.date),
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    };
  } else {
    datetime = {
      type: 'all-day',
      date: new Date(dto.date),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    };
  }

  return {
    title: dto.title,
    datetime,
    venue: dto.venue,
  };
}

export function mapDtoToEventDateTime(dto: SubmitEventDto): EventDateTime {
  if (dto.type === 'specific') {
    return {
      type: 'specific',
      date: new Date(dto.date),
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    };
  }

  return {
    type: 'all-day',
    date: new Date(dto.date),
    endDate: dto.endDate ? new Date(dto.endDate) : undefined,
  };
}
