import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/ports/category.repository.port.js';
import { CreateCategoryAttributeInput } from '../../domain/types/category.types.js';
import { CategoryAttribute, AttributeType } from '../../domain/types/category-attribute.entity.js';

@Injectable()
export class CreateCategoryAttributeUseCase {
  constructor(private readonly repo: ICategoryRepository) {}

  async execute(categoryId: string, input: CreateCategoryAttributeInput): Promise<CategoryAttribute> {
    const category = await this.repo.findById(categoryId);
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    if (!category.parentId) {
      throw new BadRequestException('Attributes can only be added to leaf categories.');
    }

    if (input.type === AttributeType.SELECT) {
      if (!input.options || input.options.length === 0) {
        throw new BadRequestException('SELECT attributes must have at least one option.');
      }
    }

    // Check uniqueness (Prisma throws P2002, but we can check upfront or let it throw. We'll let Prisma handle it or we can fetch existing).
    const existing = await this.repo.findAttributesByCategoryId(categoryId);
    if (existing.some((a) => a.key === input.key)) {
      throw new ConflictException(`Attribute with key '${input.key}' already exists for this category.`);
    }
    return this.repo.createAttribute({ ...input, categoryId } as CreateCategoryAttributeInput & { categoryId: string });
  }
}
