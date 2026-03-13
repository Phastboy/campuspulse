import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

/**
 * Minimal DTO for directly creating an event record.
 *
 * Used by the Phase 1 curator workflow where events are created directly
 * rather than going through the ingestion pipeline. Most event creation
 * in Phase 2+ flows through {@link SubmitEventDto} instead.
 *
 * @example
 * {
 *   "title": "NACOS Parliamentary Summit 2026",
 *   "date": "2026-02-28",
 *   "venue": "ACE Conference Hall, ICT"
 * }
 */
export class CreateEventDto {
  /** Human-readable event title. */
  @IsString()
  @IsNotEmpty()
  title!: string;

  /** Event date in ISO 8601 format. */
  @IsDateString()
  date!: string;

  /** Venue name as commonly known on campus. */
  @IsString()
  @IsNotEmpty()
  venue!: string;
}
