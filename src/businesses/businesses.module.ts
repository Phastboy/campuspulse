import { Module } from '@nestjs/common';
import { BusinessesController } from './delivery/http/businesses.controller.js';
import { CreateBusinessProfileUseCase } from './use-cases/create-business-profile.use-case.js';
import { UpdateBusinessProfileUseCase } from './use-cases/update-business-profile.use-case.js';
import { DeleteBusinessProfileUseCase } from './use-cases/delete-business-profile.use-case.js';
import { DiscoverBusinessProfilesUseCase } from './use-cases/discover-business-profiles.use-case.js';
import { GetBusinessProfileBySlugUseCase } from './use-cases/get-business-profile-by-slug.use-case.js';
import { GetMyBusinessProfilesUseCase } from './use-cases/get-my-business-profiles.use-case.js';
import { GetBusinessListingsUseCase } from './use-cases/get-business-listings.use-case.js';
import { PrismaBusinessProfileRepository } from './infrastructure/prisma-business-profile.repository.js';
import { BUSINESS_PROFILE_REPOSITORY_TOKEN } from './core/ports/business-profile.repository.interface.js';
import { ListingsModule } from '../listings/listings.module.js';

@Module({
  imports: [ListingsModule],
  controllers: [BusinessesController],
  providers: [
    CreateBusinessProfileUseCase,
    UpdateBusinessProfileUseCase,
    DeleteBusinessProfileUseCase,
    DiscoverBusinessProfilesUseCase,
    GetBusinessProfileBySlugUseCase,
    GetMyBusinessProfilesUseCase,
    GetBusinessListingsUseCase,
    {
      provide: BUSINESS_PROFILE_REPOSITORY_TOKEN,
      useClass: PrismaBusinessProfileRepository,
    },
  ],
  exports: [GetMyBusinessProfilesUseCase],
})
export class BusinessesModule {}
