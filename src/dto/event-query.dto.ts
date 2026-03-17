import { IsOptional, IsInt, Min, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { DATETIME_TYPES, type DatetimeType } from '@common/constants';

export class EventQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsIn(DATETIME_TYPES)
  type?: DatetimeType;

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
