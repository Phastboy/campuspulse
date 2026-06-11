import { Module } from '@nestjs/common';
import { CreateBusinessDraftUseCase } from './application/use-cases/create-business-draft.use-case.js';
import { RequestDraftVerificationUseCase } from './application/use-cases/request-draft-verification.use-case.js';
import { VerifyDraftAndPublishUseCase } from './application/use-cases/verify-draft-and-publish.use-case.js';
import { CreateBusinessProfileUseCase } from './application/use-cases/create-business-profile.use-case.js';
import { DeleteBusinessProfileUseCase } from './application/use-cases/delete-business-profile.use-case.js';
import { DiscoverBusinessesUseCase } from './application/use-cases/discover-businesses.use-case.js';
import { GetMyBusinessProfilesUseCase } from './application/use-cases/get-my-business-profiles.use-case.js';
import { GetPublicBusinessProfileUseCase } from './application/use-cases/get-public-business-profile.use-case.js';
import { UpdateBusinessProfileUseCase } from './application/use-cases/update-business-profile.use-case.js';
import { SetOperatingHoursUseCase } from './application/use-cases/set-operating-hours.use-case.js';
import { SetBusinessTagsUseCase } from './application/use-cases/set-business-tags.use-case.js';
import { GetTagsUseCase } from './application/use-cases/get-tags.use-case.js';
import { BusinessProfileController } from './api/controllers/business-profile.controller.js';
import { PublicBusinessProfileController } from './api/controllers/public-business-profile.controller.js';
import { IBusinessProfileRepository } from './domain/ports/business-profile.repository.port.js';
import { PrismaBusinessProfileRepository } from './infrastructure/prisma-business-profile.repository.js';
import { ITagRepository } from './domain/ports/tag.repository.port.js';
import { PrismaTagRepository } from './infrastructure/prisma-tag.repository.js';

import { MailModule } from '../../mail/mail.module.js';

@Module({
  imports: [MailModule],
  controllers: [PublicBusinessProfileController, BusinessProfileController],
  providers: [
    { provide: IBusinessProfileRepository, useClass: PrismaBusinessProfileRepository },
    { provide: ITagRepository, useClass: PrismaTagRepository },
    CreateBusinessDraftUseCase,
    RequestDraftVerificationUseCase,
    VerifyDraftAndPublishUseCase,
    CreateBusinessProfileUseCase,
    UpdateBusinessProfileUseCase,
    DeleteBusinessProfileUseCase,
    GetPublicBusinessProfileUseCase,
    GetMyBusinessProfilesUseCase,
    DiscoverBusinessesUseCase,
    SetOperatingHoursUseCase,
    SetBusinessTagsUseCase,
    GetTagsUseCase,
  ],
})
export class BusinessProfileModule {}
