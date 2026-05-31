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

@Module({
  controllers: [PublicCategoryController, CategoryController],
  providers: [
    { provide: ICategoryRepository, useClass: PrismaCategoryRepository },
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeactivateCategoryUseCase,
    GetCategoryTreeUseCase,
    GetCategoryUseCase,
  ],
  exports: [ICategoryRepository, GetCategoryUseCase, GetCategoryTreeUseCase],
})
export class CategoryModule {}
