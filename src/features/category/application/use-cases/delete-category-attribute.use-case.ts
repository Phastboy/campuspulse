import { Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/ports/category.repository.port.js';

@Injectable()
export class DeleteCategoryAttributeUseCase {
  constructor(private readonly repo: ICategoryRepository) {}

  async execute(categoryId: string, attributeId: string): Promise<void> {
    const existingAttributes = await this.repo.findAttributesByCategoryId(categoryId);
    const target = existingAttributes.find((a) => a.id === attributeId);

    if (!target) {
      throw new NotFoundException('Attribute not found for this category.');
    }

    await this.repo.deleteAttribute(attributeId);
  }
}
