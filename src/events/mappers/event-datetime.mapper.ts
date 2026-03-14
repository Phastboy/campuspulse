import { EventDateTime } from '@common';
import { EventSubmission } from '../domain/event-submission';
import { SubmitEventDto } from '../../ingestion/dto/submit-event.dto';

/**
 * Maps flat DTO fields into structured domain objects.
 *
 * **Single Responsibility:** this class has one job — convert between the
 * flat, validated HTTP input shape ({@link SubmitEventDto}) and the rich,
 * structured domain types ({@link EventDateTime}, {@link EventSubmission}).
 *
 * Before this existed, {@link SubmitEventDto} carried both validation
 * decorators and transformation logic — two distinct reasons to change.
 * Now the DTO is responsible only for validation; this mapper is responsible
 * only for transformation. Each can change independently.
 *
 * @example
 * const mapper = new EventDateTimeMapper();
 * const submission = mapper.toEventSubmission(dto);
 * const datetime  = mapper.toEventDateTime(dto);
 */
export class EventDateTimeMapper {
  /**
   * Converts a validated {@link SubmitEventDto} into an {@link EventSubmission}
   * domain object for use in the ingestion pipeline and similarity engine.
   *
   * @param dto - Validated submission DTO
   * @returns Domain submission with hydrated `Date` objects
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
   *
   * Converts ISO 8601 strings to `Date` objects and assembles the correct
   * discriminated union shape based on `dto.type`.
   *
   * @param dto - Validated DTO with flat date/time fields
   * @returns Hydrated `EventDateTime` in the correct shape
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
