import type {
  BusinessType,
  VerificationStatus,
} from '../../../core/domain/business-profile.view.js';

export class BusinessProfileResponseDto {
  id!: string;
  slug!: string;
  name!: string;
  description!: string | null;
  type!: BusinessType;

  logoUrl!: string | null;
  bannerUrl!: string | null;

  email!: string | null;
  phoneNumber!: string | null;
  whatsapp!: string | null;
  location!: string | null;

  verificationStatus!: VerificationStatus;
  isPublic!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export class PaginatedBusinessProfilesResponseDto {
  data!: BusinessProfileResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
