import { PartialType } from '@nestjs/swagger';
import { EventFieldsDto } from '@common/dto/event-fields.dto';

/**
 * DTO for partial event updates via `PATCH /api/events/:id`.
 *
 * All fields from {@link EventFieldsDto} are available but none are required.
 * Previously this extended `SubmitEventDto` directly, creating a dependency
 * from `events/` into `ingestion/`. It now extends the shared base in
 * `common/` so neither feature module depends on the other.
 */
export class UpdateEventDto extends PartialType(EventFieldsDto) {}
