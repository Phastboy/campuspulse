/**
 * A Review represents a single user-submitted evaluation of a BusinessProfile.
 *
 * Invariants (enforced at application layer):
 *   - rating is an integer in [1, 5]
 *   - one review per (businessProfileId, reviewerId) pair
 *   - only the reviewer can mutate their review
 */
export interface Review {
  readonly id: string;

  readonly listingId: string;
  readonly reviewerId: string;

  /** Integer 1–5 */
  readonly rating: number;
  readonly comment: string | null;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}
