import { IsString, IsOptional, IsDateString, IsIn, ValidateIf, IsUUID } from 'class-validator';

export class ConfirmSubmissionDto {
  // Original submission fields
  @IsString()
  title!: string;

  @IsString()
  @IsIn(['specific', 'all-day'])
  type!: 'specific' | 'all-day';

  @IsDateString()
  date!: string;

  @IsOptional()
  @ValidateIf(o => o.type === 'specific')
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @ValidateIf(o => o.type === 'all-day')
  @IsDateString()
  endDate?: string;

  @IsString()
  venue!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // User decision
  @IsIn(['new', 'duplicate'])
  decision!: 'new' | 'duplicate';

  // Required if duplicate
  @ValidateIf(o => o.decision === 'duplicate')
  @IsUUID()
  existingEventId?: string;
}
