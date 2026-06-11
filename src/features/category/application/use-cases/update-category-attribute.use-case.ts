import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/ports/category.repository.port.js';
import { UpdateCategoryAttributeInput } from '../../domain/types/category.types.js';
import { CategoryAttribute, AttributeType } from '../../domain/types/category-attribute.entity.js';

@Injectable()
export class UpdateCategoryAttributeUseCase {
  constructor(private readonly repo: ICategoryRepository) {}

  async execute(
    categoryId: string,
    attributeId: string,
    input: UpdateCategoryAttributeInput,
  ): Promise<CategoryAttribute> {
    const existingAttributes = await this.repo.findAttributesByCategoryId(categoryId);
    const target = existingAttributes.find((a) => a.id === attributeId);

    if (!target) {
      throw new NotFoundException('Attribute not found for this category.');
    }

    if (target.type === AttributeType.SELECT && input.options !== undefined) {
      if (input.options === null || input.options.length === 0) {
        throw new BadRequestException('SELECT attributes must have at least one option.');
      }
    }

    if (target.type !== AttributeType.SELECT && input.options) {
      throw new BadRequestException('Only SELECT attributes can have options.');
    }

    return this.repo.updateAttribute(attributeId, input);
  }
}
