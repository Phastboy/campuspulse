import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { Public } from '@odysseon/whoami-adapter-nestjs';
import { GetCategoryTreeUseCase } from '../../application/use-cases/get-category-tree.use-case.js';
import { GetCategoryUseCase } from '../../application/use-cases/get-category.use-case.js';
import { CategoryResponseDto, CategoryTreeNodeDto } from '../dto/response.dto.js';
import { ICategoryRepository } from '../../domain/ports/category.repository.port.js';

/**
 * Public category browse endpoints — no authentication required.
 *
 * GET /categories            — full taxonomy tree (active only)
 * GET /categories/:slug      — single category by slug
 */
@Public()
@Controller('categories')
export class PublicCategoryController {
  constructor(
    private readonly getCategoryTree: GetCategoryTreeUseCase,
    private readonly getCategory: GetCategoryUseCase,
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  @Get()
  async getTree(): Promise<CategoryTreeNodeDto[]> {
    const tree = await this.getCategoryTree.execute(true); // active only
    return tree.map((node) => CategoryTreeNodeDto.from(node));
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<CategoryResponseDto> {
    const view = await this.getCategory.bySlug(slug);
    return CategoryResponseDto.from(view);
  }

  @Get(':slug/attributes')
  async getAttributes(@Param('slug') slug: string) {
    const category = await this.categoryRepo.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    return this.categoryRepo.findAttributesByCategoryId(category.id);
  }
}
