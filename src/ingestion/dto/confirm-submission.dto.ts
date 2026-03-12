import { IsIn, ValidateIf, IsUUID } from 'class-validator';
import { SubmitEventDto } from './submit-event.dto';

export class ConfirmSubmissionDto extends SubmitEventDto {
  @IsIn(['new', 'duplicate'])
  decision!: 'new' | 'duplicate';

  @ValidateIf((o) => o.decision === 'duplicate')
  @IsUUID()
  existingEventId?: string;
}
