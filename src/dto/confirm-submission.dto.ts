import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, ValidateIf, IsUUID } from 'class-validator';
import { SubmitEventDto } from './submit-event.dto';
import {
  SUBMISSION_DECISIONS,
  type SubmissionDecision,
} from '@common/constants';

export class ConfirmSubmissionDto extends SubmitEventDto {
  @ApiProperty({ enum: SUBMISSION_DECISIONS, example: 'duplicate' })
  @IsIn(SUBMISSION_DECISIONS)
  decision!: SubmissionDecision;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ValidateIf((o: ConfirmSubmissionDto) => o.decision === 'duplicate')
  @IsUUID()
  existingEventId?: string;
}
