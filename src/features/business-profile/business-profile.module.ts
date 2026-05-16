import { Module } from '@nestjs/common';
import { CreateBusinessProfileUseCase } from './application/use-cases/create-business-profile.use-case.js';
import { DeleteBusinessProfileUseCase } from './application/use-cases/delete-business-profile.use-case.js';
import { DiscoverBusinessesUseCase } from './application/use-cases/discover-businesses.use-case.js';
import { GetMyBusinessProfilesUseCase } from './application/use-cases/get-my-business-profiles.use-case.js';
import { GetPublicBusinessProfileUseCase } from './application/use-cases/get-public-business-profile.use-case.js';
import { UpdateBusinessProfileUseCase } from './application/use-cases/update-business-profile.use-case.js';
import { BusinessProfileController } from './api/controllers/business-profile.controller.js';
import { PublicBusinessProfileController } from './api/controllers/public-business-profile.controller.js';
import { IBusinessProfileRepository } from './domain/ports/business-profile.repository.port.js';
import { PrismaBusinessProfileRepository } from './infrastructure/prisma-business-profile.repository.js';
import { BusinessBrandingController } from './api/controllers/business-branding.controller.js';
import { UploadBusinessBannerUseCase } from './application/use-cases/upload-business-banner.use-case.js';
import { UploadBusinessLogoUseCase } from './application/use-cases/upload-business-logo.use-case.js';

@Module({
  controllers: [
    PublicBusinessProfileController,
    BusinessProfileController,
    BusinessBrandingController,
  ],
  providers: [
    {
      provide: IBusinessProfileRepository,
      useClass: PrismaBusinessProfileRepository,
    },
    CreateBusinessProfileUseCase,
    UpdateBusinessProfileUseCase,
    DeleteBusinessProfileUseCase,
    GetPublicBusinessProfileUseCase,
    GetMyBusinessProfilesUseCase,
    DiscoverBusinessesUseCase,
    UploadBusinessBannerUseCase,
    UploadBusinessLogoUseCase,
  ],
})
export class BusinessProfileModule {}
