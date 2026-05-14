import { Module } from '@nestjs/common';
import { ListingsController } from './delivery/http/listings.controller.js';
import { ListingsService } from './use-cases/listings.service.js';
import { CreateListingUseCase } from './use-cases/create-listing.use-case.js';
import { DiscoverListingsUseCase } from './use-cases/discover-listings.use-case.js';
import { GetListingDetailUseCase } from './use-cases/get-listing-detail.use-case.js';
import { PrismaListingsRepository } from './infrastructure/prisma-listings.repository.js';
import { LISTING_REPOSITORY_TOKEN } from './core/ports/listing.repository.interface.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { UpdateListingUseCase } from './use-cases/update-listing.use-case.js';
import { DeleteListingUseCase } from './use-cases/delete-listing.use-case.js';

@Module({
  imports: [CategoriesModule],
  controllers: [ListingsController],
  providers: [
    ListingsService,
    CreateListingUseCase,
    DiscoverListingsUseCase,
    GetListingDetailUseCase,
    UpdateListingUseCase,
    DeleteListingUseCase,
    {
      provide: LISTING_REPOSITORY_TOKEN,
      useClass: PrismaListingsRepository,
    },
  ],
  exports: [LISTING_REPOSITORY_TOKEN],
})
export class ListingsModule {}
