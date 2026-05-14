import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';
import type { BusinessType } from '../../../core/domain/business-profile.view.js';

export class CreateBusinessProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum([
    'INDIVIDUAL',
    'RETAILER',
    'DISTRIBUTOR',
    'MANUFACTURER',
    'WHOLESALER',
    'AGENCY',
  ] as const)
  @IsOptional()
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
