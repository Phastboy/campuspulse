export interface CreateReviewInput {
  readonly listingId: string;
  /** Resolved user ID of the authenticated caller */
  readonly reviewerId: string;
  readonly rating: number;
  readonly comment?: string;
  readonly mediaIds?: string[];
}

export interface UpdateReviewInput {
  readonly rating?: number;
  readonly comment?: string | null;
  // Currently, we don't allow changing the attached listingId after creation
  // Media handling (e.g., adding/removing) might be done via separate endpoints or integrated here.
}

export interface GetListingReviewsInput {
  readonly listingId: string;
  /** Cursor-based pagination — ID of the last item received */
  readonly cursor?: string;
  readonly limit?: number;
}

export interface ReviewPage {
  readonly items: ReviewWithMedia[];
  /** Pass as `cursor` in the next request. Null if no more pages. */
  readonly nextCursor: string | null;
}

export interface ReviewWithMedia {
  readonly id: string;
  readonly listingId: string;
  readonly reviewerId: string;
  readonly rating: number;
  readonly comment: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  /** Ordered gallery photos attached to this review */
  readonly media: ReviewMediaItem[];
}

export interface ReviewMediaItem {
  readonly id: string;
  readonly url: string;
  readonly mediaType: string;
  readonly order: number | null;
  readonly createdAt: Date;
}
