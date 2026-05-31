import { BusinessProfile } from '../../domain/types/business-profile.entity.js';
import {
  BusinessSummary,
  PaginatedBusinessSummaries,
} from '../../domain/types/business-profile.types.js';

export class BusinessProfileResponseDto {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  isPublic: boolean;
  verificationStatus: string;
  description: string | null;
  phoneNumber: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  createdAt: string;

  private constructor(profile: BusinessProfile) {
    this.id = profile.id;
    this.ownerId = profile.ownerId;
    this.name = profile.name;
    this.slug = profile.slug;
    this.isPublic = profile.isPublic;
    this.verificationStatus = profile.verificationStatus;
    this.description = profile.description;
    this.phoneNumber = profile.phoneNumber;
    this.whatsapp = profile.whatsapp;
    this.email = profile.email;
    this.location = profile.location;
    this.createdAt = profile.createdAt.toISOString();
  }

  static from(profile: BusinessProfile): BusinessProfileResponseDto {
    return new BusinessProfileResponseDto(profile);
  }
}

export class BusinessSummaryResponseDto {
  id: string;
  name: string;
  slug: string;
  verificationStatus: string;
  description: string | null;
  location: string | null;

  private constructor(summary: BusinessSummary) {
    this.id = summary.id;
    this.name = summary.name;
    this.slug = summary.slug;
    this.verificationStatus = summary.verificationStatus;
    this.description = summary.description;
    this.location = summary.location;
  }

  static from(summary: BusinessSummary): BusinessSummaryResponseDto {
    return new BusinessSummaryResponseDto(summary);
  }
}

export class PaginatedBusinessesResponseDto {
  items: BusinessSummaryResponseDto[];
  total: number;
  page: number;
  limit: number;

  private constructor(paginated: PaginatedBusinessSummaries) {
    this.items = paginated.items.map((s) => BusinessSummaryResponseDto.from(s));
    this.total = paginated.total;
    this.page = paginated.page;
    this.limit = paginated.limit;
  }

  static from(paginated: PaginatedBusinessSummaries): PaginatedBusinessesResponseDto {
    return new PaginatedBusinessesResponseDto(paginated);
  }
}
