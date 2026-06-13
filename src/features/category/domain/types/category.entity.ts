/**
 * A Category is a platform-managed taxonomy node that gives commercial identity
 * to business profiles and listings.
 *
 * Depth model: max 2 levels.
 *   Root  (parentId = null)  — grouping node, not directly assignable
 *   Leaf  (parentId != null) — the only nodes assignable to entities
 *
 * Enforced at application layer, not DB constraint.
 */
export interface Category {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;

  /**
   * null  → root node (grouping, not assignable)
   * value → leaf node (directly taggable by businesses/listings)
   */
  readonly parentId: string | null;
  readonly parent?: Category | null;

  /** Display sort order within siblings. */
  readonly order: number;

  /**
   * Soft-disable flag.
   * false → hidden from filters, not assignable to new entities.
   * Existing assignments on inactive categories are preserved.
   */
  readonly isActive: boolean;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}
