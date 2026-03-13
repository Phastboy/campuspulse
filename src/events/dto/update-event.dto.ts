import { PartialType } from '@nestjs/swagger';
import { SubmitEventDto } from '../../ingestion/dto/submit-event.dto';

export class UpdateEventDto extends PartialType(SubmitEventDto) {}
