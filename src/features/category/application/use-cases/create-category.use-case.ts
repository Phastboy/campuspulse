import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ICategoryRepository } from '../../domain/ports/category.repository.port.js';
import { Category } from '../../domain/types/category.entity.js';
import { CreateCategoryInput } from '../../domain/types/category.types.js';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CreateCategoryUseCase {
  constructor(private readonly categories: ICategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    // -------------------------------------------------------------------------
    // Depth constraint: if parentId is set, the parent must be a root node
    // -------------------------------------------------------------------------
    if (input.parentId) {
      const parent = await this.categories.findById(input.parentId);
      if (!parent) {
        throw new NotFoundException(`Parent category not found: ${input.parentId}`);
      }
      if (parent.parentId !== null) {
        throw new BadRequestException(
          'Category depth limit exceeded. A leaf category cannot be a parent. Max depth is 2 (root → leaf).',
        );
      }
    }

    // -------------------------------------------------------------------------
    // Slug: use provided slug or derive from name
    // -------------------------------------------------------------------------
    const slug = input.slug ? input.slug : slugify(input.name);

    if (!slug) {
      throw new BadRequestException('Could not derive a valid slug from the provided name.');
    }

    const taken = await this.categories.isSlugTaken(slug);
    if (taken) {
      throw new ConflictException(`Category slug already taken: "${slug}"`);
    }

    return this.categories.create(input, slug);
  }
}
