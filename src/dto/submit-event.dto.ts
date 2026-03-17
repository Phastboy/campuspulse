import { EventFieldsDto } from './event-fields.dto';

/**
 * HTTP input payload for submitting a new event to the ingestion pipeline.
 * Validation and field definitions live in {@link EventFieldsDto}.
 */
export class SubmitEventDto extends EventFieldsDto {}
