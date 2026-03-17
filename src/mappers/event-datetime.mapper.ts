import { EventDateTime } from '@common/datetime';
import { EventSubmission } from '@domain/types';
import { SubmitEventDto } from '@dto/submit-event.dto';

/**
 * Maps ingestion DTOs into structured domain objects.
 *
 * Single responsibility: convert flat validated strings (ISO 8601) into
 * hydrated `Date` objects assembled into the correct {@link EventDateTime}
 * union shape. The DTO validates; this mapper transforms.
 */
export class EventDateTimeMapper {
  toEventSubmission(dto: SubmitEventDto): EventSubmission {
    return {
      title: dto.title,
      datetime: this.toEventDateTime(dto),
      venue: dto.venue,
    };
  }

  toEventDateTime(dto: SubmitEventDto): EventDateTime {
    if (dto.type === 'specific') {
      if (!dto.startTime) {
        throw new Error(
          'Invalid event: startTime is required for specific events',
        );
      }

      const startTime = new Date(dto.startTime);

      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid event: startTime is not a valid date');
      }

      return {
        type: 'specific',
        date: new Date(dto.date),
        startTime,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      };
    }

    return {
      type: 'all-day',
      date: new Date(dto.date),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    };
  }
}
