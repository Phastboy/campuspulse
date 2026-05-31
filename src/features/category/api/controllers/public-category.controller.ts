import { Controller, Get, Param } from '@nestjs/common';
import { GetCategoryTreeUseCase } from '../../application/use-cases/get-category-tree.use-case.js';
import { GetCategoryUseCase } from '../../application/use-cases/get-category.use-case.js';
import { CategoryResponseDto, CategoryTreeNodeDto } from '../dto/response.dto.js';

/**
 * Public category browse endpoints — no authentication required.
 *
 * GET /categories            — full taxonomy tree (active only)
 * GET /categories/:slug      — single category by slug
 */
@Controller('categories')
export class PublicCategoryController {
  constructor(
    private readonly getCategoryTree: GetCategoryTreeUseCase,
    private readonly getCategory: GetCategoryUseCase,
  ) {}

  @Get()
  async getTree(): Promise<CategoryTreeNodeDto[]> {
    const tree = await this.getCategoryTree.execute(true); // active only
    return tree.map(CategoryTreeNodeDto.from);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<CategoryResponseDto> {
    const view = await this.getCategory.bySlug(slug);
    return CategoryResponseDto.from(view);
  }
}
