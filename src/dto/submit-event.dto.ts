import { EventFieldsDto } from './event-fields.dto';
import { ValidateIf, IsDateString, IsDefined } from 'class-validator';

/**
 * HTTP input payload for submitting a new event to the ingestion pipeline.
 * Adds ingestion-specific validation rules on top of {@link EventFieldsDto}.
 */
export class SubmitEventDto extends EventFieldsDto {
  @ValidateIf((o) => o.type === 'specific')
  @IsDefined()
  @IsDateString()
  declare startTime: string;
}
