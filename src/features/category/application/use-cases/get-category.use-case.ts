import { Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/ports/category.repository.port.js';
import { CategoryView, toCategoryView } from '../../domain/types/category.types.js';

@Injectable()
export class GetCategoryUseCase {
  constructor(private readonly categories: ICategoryRepository) {}

  async byId(id: string): Promise<CategoryView> {
    const cat = await this.categories.findById(id);
    if (!cat) throw new NotFoundException(`Category not found: ${id}`);
    return toCategoryView(cat);
  }

  async bySlug(slug: string): Promise<CategoryView> {
    const cat = await this.categories.findBySlug(slug);
    if (!cat) throw new NotFoundException(`Category not found: ${slug}`);
    return toCategoryView(cat);
  }
}
