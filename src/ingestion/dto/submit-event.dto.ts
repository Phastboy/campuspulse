import { EventFieldsDto } from '@common/dto/event-fields.dto';

/**
 * HTTP input payload for submitting a new event to the ingestion pipeline.
 *
 * Extends {@link EventFieldsDto} which holds all field definitions and
 * validators in one place, shared with {@link UpdateEventDto} without either
 * module importing from the other.
 *
 * **Single Responsibility:** validate and carry raw HTTP input only.
 * Domain object construction is the responsibility of {@link EventDateTimeMapper}.
 *
 * @example
 * { "title": "NACOS Parliamentary Summit 2026", "type": "specific",
 *   "date": "2026-02-28", "startTime": "2026-02-28T10:00:00.000Z",
 *   "venue": "ACE Conference Hall, ICT" }
 */
export class SubmitEventDto extends EventFieldsDto {}
