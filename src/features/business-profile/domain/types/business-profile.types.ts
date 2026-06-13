import { VerificationStatus } from './verification-status.enum.js';
import { OperatingHours } from './operating-hours.types.js';
import { Tag } from './tag.types.js';
import { BusinessType } from '../../../../../generated/prisma/client.js';

export interface CreateBusinessProfileInput {
  readonly ownerId: string;
  readonly name: string;
  readonly businessType: BusinessType;
  readonly phoneNumber: string;
  readonly whatsapp: string;
  readonly email: string;
  readonly description?: string;
  readonly websiteUrl?: string;
  readonly location?: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

export interface UpdateBusinessProfileInput {
  readonly name?: string;
  readonly businessType?: BusinessType;
  readonly description?: string;
  readonly websiteUrl?: string;
  readonly phoneNumber?: string;
  readonly whatsapp?: string;
  readonly email?: string;
  readonly location?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly isPublic?: boolean;
}

export interface BusinessProfileView {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly slug: string;
  readonly isPublic: boolean;
  readonly verificationStatus: VerificationStatus;
  readonly businessType: BusinessType;
  readonly isEmailVerified: boolean;
  readonly isPhoneVerified: boolean;
  readonly description: string | null;
  readonly phoneNumber: string;
  readonly whatsapp: string;
  readonly email: string;
  readonly websiteUrl: string | null;
  readonly locationId: string | null;
  readonly location: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly categoryId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly operatingHours?: OperatingHours[];
  readonly tags?: Tag[];
}

export interface BusinessSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly verificationStatus: VerificationStatus;
  readonly businessType: BusinessType;
  readonly description: string | null;
  readonly location: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly categoryId: string | null;
  readonly distanceKm?: number; // Added dynamically during proximity queries
}

export interface DiscoverBusinessesInput {
  readonly verificationStatus?: VerificationStatus;
  readonly search?: string;
  /** Filter by an exact leaf categoryId */
  readonly categoryId?: string;
  /** Filter by root category slug — returns all businesses in any leaf under that root */
  readonly rootSlug?: string;
  readonly lat?: number;
  readonly lng?: number;
  readonly radiusInKm?: number;
  readonly page: number;
  readonly limit: number;
}

export interface PaginatedBusinessSummaries {
  readonly items: BusinessSummary[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
