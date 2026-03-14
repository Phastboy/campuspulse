import { EventDateTime } from '@common';
import { EventSubmission } from '@events/domain';
import { SubmitEventDto } from '../dto/submit-event.dto';

/**
 * Maps ingestion DTOs into structured domain objects.
 *
 * Lives in `ingestion/mappers/` because it maps ingestion-specific input
 * (flat HTTP fields on {@link SubmitEventDto}) into domain types. The
 * previous location in `events/mappers/` created an upward dependency —
 * `events/` reaching into `ingestion/` to import `SubmitEventDto`.
 *
 * **Single Responsibility:** convert flat validated strings into hydrated
 * `Date` objects assembled into the correct `EventDateTime` union shape.
 */
export class EventDateTimeMapper {
  /**
   * Converts a validated {@link SubmitEventDto} into an {@link EventSubmission}
   * domain object for use in the ingestion pipeline and similarity engine.
   */
  toEventSubmission(dto: SubmitEventDto): EventSubmission {
    return {
      title: dto.title,
      datetime: this.toEventDateTime(dto),
      venue: dto.venue,
    };
  }

  /**
   * Builds a structured {@link EventDateTime} from the flat date/time string
   * fields on a {@link SubmitEventDto}.
   */
  toEventDateTime(dto: SubmitEventDto): EventDateTime {
    if (dto.type === 'specific') {
      return {
        type: 'specific',
        date: new Date(dto.date),
        startTime: new Date(dto.startTime),
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
