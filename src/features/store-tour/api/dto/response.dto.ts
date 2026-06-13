import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreTourStatus, StoreTourMediaItem } from '../../domain/types/store-tour.entity.js';
import { PaginatedStoreTours, StoreTourView } from '../../domain/types/store-tour.types.js';

export class StoreTourHighlightDto {
  @ApiProperty() id: string;
  @ApiProperty() value: string;

  private constructor(h: { id: string; value: string }) {
    this.id = h.id;
    this.value = h.value;
  }

  static from(h: { id: string; value: string }) {
    return new StoreTourHighlightDto(h);
  }
}

export class StoreTourMediaItemDto {
  @ApiProperty() id: string;
  @ApiProperty() url: string;
  @ApiProperty() mediaType: string;
  @ApiPropertyOptional({ nullable: true }) order: number | null;
  @ApiProperty() createdAt: string;

  private constructor(m: StoreTourMediaItem) {
    this.id = m.id;
    this.url = m.url;
    this.mediaType = m.mediaType;
    this.order = m.order;
    this.createdAt = m.createdAt.toISOString();
  }

  static from(m: StoreTourMediaItem): StoreTourMediaItemDto {
    return new StoreTourMediaItemDto(m);
  }
}

export class StoreTourResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() businessProfileId: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional({ nullable: true }) summary: string | null;
  @ApiProperty() visitDate: string;
  @ApiProperty({ enum: StoreTourStatus }) status: StoreTourStatus;
  @ApiPropertyOptional({ nullable: true }) publishedAt: string | null;
  @ApiProperty() createdById: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
  @ApiProperty({ type: [StoreTourHighlightDto] }) highlights: StoreTourHighlightDto[];
  @ApiProperty({ type: [StoreTourMediaItemDto] }) media: StoreTourMediaItemDto[];

  private constructor(tour: StoreTourView) {
    this.id = tour.id;
    this.businessProfileId = tour.businessProfileId;
    this.title = tour.title;
    this.summary = tour.summary;
    this.visitDate = tour.visitDate.toISOString();
    this.status = tour.status;
    this.publishedAt = tour.publishedAt ? tour.publishedAt.toISOString() : null;
    this.createdById = tour.createdById;
    this.createdAt = tour.createdAt.toISOString();
    this.updatedAt = tour.updatedAt.toISOString();
    this.highlights = tour.highlights.map((h) => StoreTourHighlightDto.from(h));
    this.media = tour.media.map((m) => StoreTourMediaItemDto.from(m));
  }

  static from(tour: StoreTourView): StoreTourResponseDto {
    return new StoreTourResponseDto(tour);
  }
}

export class PaginatedStoreToursResponseDto {
  @ApiProperty({ type: [StoreTourResponseDto] }) items: StoreTourResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;

  private constructor(paginated: PaginatedStoreTours) {
    this.items = paginated.items.map((i) => StoreTourResponseDto.from(i));
    this.total = paginated.total;
    this.page = paginated.page;
    this.limit = paginated.limit;
  }

  static from(paginated: PaginatedStoreTours): PaginatedStoreToursResponseDto {
    return new PaginatedStoreToursResponseDto(paginated);
  }
}
