export abstract class IReviewRepository {
  abstract create(
    input: import('../types/review.types.js').CreateReviewInput,
  ): Promise<import('../types/review.entity.js').Review>;
  abstract findById(id: string): Promise<import('../types/review.entity.js').Review | null>;
  abstract findByIdWithMedia(
    id: string,
  ): Promise<import('../types/review.types.js').ReviewWithMedia | null>;
  abstract existsByListingAndReviewer(listingId: string, reviewerId: string): Promise<boolean>;
  abstract findByListing(
    input: import('../types/review.types.js').GetListingReviewsInput,
  ): Promise<import('../types/review.types.js').ReviewPage>;
  abstract update(
    id: string,
    input: import('../types/review.types.js').UpdateReviewInput,
  ): Promise<import('../types/review.entity.js').Review>;
  abstract delete(id: string): Promise<void>;
}
