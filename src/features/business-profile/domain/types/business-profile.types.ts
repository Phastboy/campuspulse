import { VerificationStatus } from './verification-status.enum.js';

export interface CreateBusinessProfileInput {
  readonly ownerId: string;
  readonly name: string;
  readonly description?: string;
  readonly phoneNumber?: string;
  readonly whatsapp?: string;
  readonly email?: string;
  readonly location?: string;
}

export interface UpdateBusinessProfileInput {
  readonly name?: string;
  readonly description?: string;
  readonly phoneNumber?: string;
  readonly whatsapp?: string;
  readonly email?: string;
  readonly location?: string;
  readonly isPublic?: boolean;
}

export interface BusinessProfileView {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly slug: string;
  readonly isPublic: boolean;
  readonly verificationStatus: VerificationStatus;
  readonly description: string | null;
  readonly phoneNumber: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly location: string | null;
  readonly categoryId: string | null;
  readonly createdAt: Date;
}

export interface BusinessSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly verificationStatus: VerificationStatus;
  readonly description: string | null;
  readonly location: string | null;
  readonly categoryId: string | null;
}

export interface DiscoverBusinessesInput {
  readonly verificationStatus?: VerificationStatus;
  readonly search?: string;
  /** Filter by an exact leaf categoryId */
  readonly categoryId?: string;
  /** Filter by root category slug — returns all businesses in any leaf under that root */
  readonly rootSlug?: string;
  readonly page: number;
  readonly limit: number;
}

export interface PaginatedBusinessSummaries {
  readonly items: BusinessSummary[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
