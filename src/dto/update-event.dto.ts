import { PartialType } from '@nestjs/swagger';
import { EventFieldsDto } from './event-fields.dto';

/**
 * DTO for partial event updates via `PATCH /api/events/:id`.
 * All fields are optional — only provided fields are updated.
 */
export class UpdateEventDto extends PartialType(EventFieldsDto) {}
