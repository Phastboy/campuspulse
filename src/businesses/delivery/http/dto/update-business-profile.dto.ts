import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';
import type { BusinessType } from '../../../core/domain/business-profile.view.js';

export class UpdateBusinessProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

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
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  logoId?: string;

  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  bannerId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
