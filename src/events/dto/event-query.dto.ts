import { IsOptional, IsInt, Min, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class EventQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsIn(['specific', 'all-day'])
  type?: 'specific' | 'all-day';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
