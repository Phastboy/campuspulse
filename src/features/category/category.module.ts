import { Module } from '@nestjs/common';
import { ICategoryRepository } from './domain/ports/category.repository.port.js';
import { PrismaCategoryRepository } from './infrastructure/prisma-category.repository.js';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case.js';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case.js';
import { DeactivateCategoryUseCase } from './application/use-cases/deactivate-category.use-case.js';
import { GetCategoryTreeUseCase } from './application/use-cases/get-category-tree.use-case.js';
import { GetCategoryUseCase } from './application/use-cases/get-category.use-case.js';
import { CategoryController } from './api/controllers/category.controller.js';
import { PublicCategoryController } from './api/controllers/public-category.controller.js';
import { CreateCategoryAttributeUseCase } from './application/use-cases/create-category-attribute.use-case.js';
import { UpdateCategoryAttributeUseCase } from './application/use-cases/update-category-attribute.use-case.js';
import { DeleteCategoryAttributeUseCase } from './application/use-cases/delete-category-attribute.use-case.js';

@Module({
  controllers: [PublicCategoryController, CategoryController],
  providers: [
    { provide: ICategoryRepository, useClass: PrismaCategoryRepository },
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeactivateCategoryUseCase,
    GetCategoryTreeUseCase,
    GetCategoryUseCase,
    CreateCategoryAttributeUseCase,
    UpdateCategoryAttributeUseCase,
    DeleteCategoryAttributeUseCase,
  ],
  exports: [ICategoryRepository, GetCategoryUseCase, GetCategoryTreeUseCase],
})
export class CategoryModule {}
