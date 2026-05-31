import { Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/ports/category.repository.port.js';
import { Category } from '../../domain/types/category.entity.js';
import { UpdateCategoryInput } from '../../domain/types/category.types.js';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private readonly categories: ICategoryRepository) {}

  async execute(id: string, input: UpdateCategoryInput): Promise<Category> {
    const existing = await this.categories.findById(id);
    if (!existing) {
      throw new NotFoundException(`Category not found: ${id}`);
    }
    return this.categories.update(id, input);
  }
}
