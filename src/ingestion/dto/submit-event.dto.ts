import { EventDateTime } from '@common';
import { EventSubmission } from '@events/domain';
import {
  IsString,
  IsOptional,
  IsDateString,
  ValidateIf,
  IsIn,
} from 'class-validator';

export class SubmitEventDto {
  @IsString()
  title!: string;

  @IsIn(['specific', 'all-day'])
  type!: 'specific' | 'all-day';

  @IsDateString()
  date!: string;

  @ValidateIf((o) => o.type === 'specific')
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ValidateIf((o) => o.type === 'all-day')
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsString()
  venue!: string;

  @IsOptional()
  @IsString()
  description?: string;

  toEventSubmission(): EventSubmission {
    let datetime: EventDateTime;

    if (this.type === 'specific') {
      datetime = {
        type: 'specific',
        date: new Date(this.date),
        endTime: this.endTime ? new Date(this.endTime) : undefined,
      };
    } else {
      datetime = {
        type: 'all-day',
        date: new Date(this.date),
        endDate: this.endDate ? new Date(this.endDate) : undefined,
      };
    }

    return {
      title: this.title,
      datetime,
      venue: this.venue,
    };
  }

  toEventDateTime(): EventDateTime {
    if (this.type === 'specific') {
      return {
        type: 'specific',
        date: new Date(this.date),
        endTime: this.endTime ? new Date(this.endTime) : undefined,
      };
    }

    return {
      type: 'all-day',
      date: new Date(this.date),
      endDate: this.endDate ? new Date(this.endDate) : undefined,
    };
  }
}
