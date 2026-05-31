import { Category } from './category.entity.js';

// ---------------------------------------------------------------------------
// Use case inputs
// ---------------------------------------------------------------------------

/**
 * Input to create a category.
 * Slug is generated from name by the use case if not provided.
 * parentId = null → root node; non-null → leaf node (parentId must be a root).
 */
export interface CreateCategoryInput {
  readonly name: string;
  readonly slug?: string;
  readonly description?: string;
  readonly parentId?: string;
  readonly order?: number;
}

/**
 * Input to update mutable fields.
 * parentId and slug are intentionally excluded — changing them breaks URLs and
 * violates the depth contract post-creation.
 */
export interface UpdateCategoryInput {
  readonly name?: string;
  readonly description?: string;
  readonly order?: number;
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

/**
 * Full flat representation of a single category.
 */
export interface CategoryView {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly parentId: string | null;
  readonly order: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * A root category with its leaf children.
 * Used for tree-shaped API responses.
 */
export interface CategoryTreeNode {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly order: number;
  readonly isActive: boolean;
  readonly children: CategoryLeaf[];
}

/**
 * A leaf category node (no children).
 */
export interface CategoryLeaf {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly order: number;
  readonly isActive: boolean;
}

// ---------------------------------------------------------------------------
// Discovery / filtering
// ---------------------------------------------------------------------------

/**
 * Input for filtering entities (businesses, listings) by category.
 *
 * categoryId   — filter by exact leaf category
 * rootSlug     — filter by root; returns all entities whose category has this root as parent
 *
 * Both are optional and mutually exclusive in the query logic.
 */
export interface CategoryFilterInput {
  readonly categoryId?: string;
  readonly rootSlug?: string;
}

// ---------------------------------------------------------------------------
// Mapping helper
// ---------------------------------------------------------------------------

export function toCategoryView(c: Category): CategoryView {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    parentId: c.parentId,
    order: c.order,
    isActive: c.isActive,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}
