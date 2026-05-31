import { Injectable } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/ports/category.repository.port.js';
import { CategoryTreeNode } from '../../domain/types/category.types.js';

@Injectable()
export class GetCategoryTreeUseCase {
  constructor(private readonly categories: ICategoryRepository) {}

  /**
   * Returns the full taxonomy tree.
   *
   * @param activeOnly — when true (default for public API), inactive roots and
   *   leaves are excluded. When false (admin view), all nodes are returned.
   */
  async execute(activeOnly = true): Promise<CategoryTreeNode[]> {
    return this.categories.findTree(activeOnly);
  }
}
