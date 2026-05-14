import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import type { BusinessType } from '../../../core/domain/business-profile.view.js';

export class GetBusinessProfilesFilterDto {
  @IsOptional()
  @IsEnum([
    'INDIVIDUAL',
    'RETAILER',
    'DISTRIBUTOR',
    'MANUFACTURER',
    'WHOLESALER',
    'AGENCY',
  ] as const)
  type?: BusinessType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;
}
