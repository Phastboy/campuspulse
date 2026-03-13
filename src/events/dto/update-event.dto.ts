import { PartialType } from '@nestjs/swagger';
import { SubmitEventDto } from '../../ingestion/dto/submit-event.dto';

/**
 * DTO for partial event updates via `PATCH /api/events/:id`.
 *
 * All fields from {@link SubmitEventDto} are available but none are required.
 * Only fields that are explicitly provided in the request body will be updated
 * on the target event — omitted fields are left unchanged.
 *
 * Uses `PartialType` from `@nestjs/swagger` (rather than `@nestjs/mapped-types`)
 * so that Swagger correctly marks all inherited fields as optional in the
 * generated OpenAPI spec.
 *
 * @example
 * // Reschedule only
 * { "date": "2026-03-07", "type": "specific", "startTime": "2026-03-07T10:00:00.000Z" }
 *
 * @example
 * // Update venue only
 * { "venue": "New Admin Block, Room 101" }
 */
export class UpdateEventDto extends PartialType(SubmitEventDto) {}
