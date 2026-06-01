import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewWithMedia, ReviewPage, ReviewMediaItem } from '../../domain/types/review.types.js';
import { Review } from '../../domain/types/review.entity.js';

// ---------------------------------------------------------------------------
// Single media item within a review
// ---------------------------------------------------------------------------

export class ReviewMediaItemDto {
  @ApiProperty() id: string;
  @ApiProperty() url: string;
  @ApiProperty() mediaType: string;
  @ApiPropertyOptional({ nullable: true }) order: number | null;
  @ApiProperty() createdAt: string;

  private constructor(m: ReviewMediaItem) {
    this.id = m.id;
    this.url = m.url;
    this.mediaType = m.mediaType;
    this.order = m.order;
    this.createdAt = m.createdAt.toISOString();
  }

  static from(m: ReviewMediaItem): ReviewMediaItemDto {
    return new ReviewMediaItemDto(m);
  }
}

// ---------------------------------------------------------------------------
// Single review (without embedded media — used for create/update responses)
// ---------------------------------------------------------------------------

export class ReviewResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() businessProfileId: string;
  @ApiProperty() reviewerId: string;
  @ApiProperty() rating: number;
  @ApiPropertyOptional({ nullable: true }) comment: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  private constructor(r: Review) {
    this.id = r.id;
    this.businessProfileId = r.businessProfileId;
    this.reviewerId = r.reviewerId;
    this.rating = r.rating;
    this.comment = r.comment;
    this.createdAt = r.createdAt.toISOString();
    this.updatedAt = r.updatedAt.toISOString();
  }

  static from(r: Review): ReviewResponseDto {
    return new ReviewResponseDto(r);
  }
}

// ---------------------------------------------------------------------------
// Review with embedded media — used in list responses
// ---------------------------------------------------------------------------

export class ReviewWithMediaDto {
  @ApiProperty() id: string;
  @ApiProperty() businessProfileId: string;
  @ApiProperty() reviewerId: string;
  @ApiProperty() rating: number;
  @ApiPropertyOptional({ nullable: true }) comment: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
  /** Raw user-uploaded photos — unprocessed, gallery-ordered */
  @ApiProperty({ type: [ReviewMediaItemDto] }) media: ReviewMediaItemDto[];

  private constructor(r: ReviewWithMedia) {
    this.id = r.id;
    this.businessProfileId = r.businessProfileId;
    this.reviewerId = r.reviewerId;
    this.rating = r.rating;
    this.comment = r.comment;
    this.createdAt = r.createdAt.toISOString();
    this.updatedAt = r.updatedAt.toISOString();
    this.media = r.media.map((m) => ReviewMediaItemDto.from(m));
  }

  static from(r: ReviewWithMedia): ReviewWithMediaDto {
    return new ReviewWithMediaDto(r);
  }
}

// ---------------------------------------------------------------------------
// Paginated list of reviews
// ---------------------------------------------------------------------------

export class ReviewPageDto {
  @ApiProperty({ type: [ReviewWithMediaDto] }) items: ReviewWithMediaDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor: string | null;

  private constructor(page: ReviewPage) {
    this.items = page.items.map((item) => ReviewWithMediaDto.from(item));
    this.nextCursor = page.nextCursor;
  }

  static from(page: ReviewPage): ReviewPageDto {
    return new ReviewPageDto(page);
  }
}
