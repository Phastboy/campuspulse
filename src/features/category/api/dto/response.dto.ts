import { CategoryView, CategoryTreeNode, CategoryLeaf } from '../../domain/index.js';

// ---------------------------------------------------------------------------
// Flat view
// ---------------------------------------------------------------------------

export class CategoryResponseDto implements CategoryView {
  id!: string;
  name!: string;
  slug!: string;
  description!: string | null;
  parentId!: string | null;
  order!: number;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static from(view: CategoryView): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    Object.assign(dto, view);
    return dto;
  }
}

// ---------------------------------------------------------------------------
// Tree view (public browse)
// ---------------------------------------------------------------------------

export class CategoryLeafDto implements CategoryLeaf {
  id!: string;
  name!: string;
  slug!: string;
  description!: string | null;
  order!: number;
  isActive!: boolean;
}

export class CategoryTreeNodeDto implements CategoryTreeNode {
  id!: string;
  name!: string;
  slug!: string;
  description!: string | null;
  order!: number;
  isActive!: boolean;
  children!: CategoryLeafDto[];

  static from(node: CategoryTreeNode): CategoryTreeNodeDto {
    const dto = new CategoryTreeNodeDto();
    Object.assign(dto, node);
    return dto;
  }
}
