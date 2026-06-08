import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '../../domain/types/currency.enum.js';
import { ListingStatus } from '../../domain/types/listing-status.enum.js';
import { Listing } from '../../domain/types/listing.entity.js';
import { ListingSummary, PaginatedListingSummaries } from '../../domain/types/listing.types.js';

export class ListingResponseDto {
  id: string;
  businessProfileId: string;
  title: string;
  slug: string;
  description: string | null;
  status: ListingStatus;
  minPrice: string | null;
  maxPrice: string | null;
  currencyCode: Currency | null;
  isNegotiable: boolean;
  @ApiPropertyOptional({ nullable: true }) categoryId: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
  @ApiPropertyOptional() reviews?: any[];

  private constructor(listing: Listing) {
    this.id = listing.id;
    this.businessProfileId = listing.businessProfileId;
    this.title = listing.title;
    this.slug = listing.slug;
    this.description = listing.description;
    this.status = listing.status;
    this.minPrice = listing.price.minPrice?.toString() ?? null;
    this.maxPrice = listing.price.maxPrice?.toString() ?? null;
    this.currencyCode = listing.price.currencyCode;
    this.isNegotiable = listing.price.isNegotiable;
    this.categoryId = listing.categoryId;
    this.createdAt = listing.createdAt.toISOString();
    this.updatedAt = listing.updatedAt.toISOString();
    this.reviews = listing.reviews?.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  static from(listing: Listing): ListingResponseDto {
    return new ListingResponseDto(listing);
  }
}

export class ListingSummaryResponseDto {
  id: string;
  businessProfileId: string;
  title: string;
  slug: string;
  description: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  currencyCode: Currency | null;
  categoryId: string | null;
  isNegotiable: boolean;

  private constructor(summary: ListingSummary) {
    this.id = summary.id;
    this.businessProfileId = summary.businessProfileId;
    this.title = summary.title;
    this.slug = summary.slug;
    this.description = summary.description;
    this.minPrice = summary.minPrice?.toString() ?? null;
    this.maxPrice = summary.maxPrice?.toString() ?? null;
    this.currencyCode = summary.currencyCode;
    this.categoryId = summary.categoryId;
    this.isNegotiable = summary.isNegotiable;
  }

  static from(summary: ListingSummary): ListingSummaryResponseDto {
    return new ListingSummaryResponseDto(summary);
  }
}

export class PaginatedListingsResponseDto {
  items: ListingSummaryResponseDto[];
  total: number;
  page: number;
  limit: number;

  private constructor(paginated: PaginatedListingSummaries) {
    this.items = paginated.items.map((s) => ListingSummaryResponseDto.from(s));
    this.total = paginated.total;
    this.page = paginated.page;
    this.limit = paginated.limit;
  }

  static from(paginated: PaginatedListingSummaries): PaginatedListingsResponseDto {
    return new PaginatedListingsResponseDto(paginated);
  }
}
