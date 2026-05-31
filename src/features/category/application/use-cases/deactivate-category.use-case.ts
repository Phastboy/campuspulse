import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/ports/category.repository.port.js';
import { Category } from '../../domain/types/category.entity.js';

@Injectable()
export class DeactivateCategoryUseCase {
  constructor(private readonly categories: ICategoryRepository) {}

  async execute(id: string): Promise<Category> {
    const existing = await this.categories.findById(id);
    if (!existing) {
      throw new NotFoundException(`Category not found: ${id}`);
    }
    if (!existing.isActive) {
      throw new BadRequestException('Category is already inactive.');
    }
    return this.categories.deactivate(id);
  }
}
