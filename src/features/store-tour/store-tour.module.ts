import { Module } from '@nestjs/common';
import { IStoreTourRepository } from './domain/ports/store-tour.repository.port.js';
import { PrismaStoreTourRepository } from './infrastructure/prisma-store-tour.repository.js';
import { CreateStoreTourUseCase } from './application/use-cases/create-store-tour.use-case.js';
import { UpdateStoreTourUseCase } from './application/use-cases/update-store-tour.use-case.js';
import { DeleteStoreTourUseCase } from './application/use-cases/delete-store-tour.use-case.js';
import { GetStoreTourUseCase } from './application/use-cases/get-store-tour.use-case.js';
import { GetBusinessStoreToursUseCase } from './application/use-cases/get-business-store-tours.use-case.js';
import { StoreTourController } from './api/controllers/store-tour.controller.js';
import { StorageModule } from '../../storage/storage.module.js';
import { MailModule } from '../../mail/mail.module.js';

@Module({
  imports: [StorageModule, MailModule],
  controllers: [StoreTourController],
  providers: [
    {
      provide: IStoreTourRepository,
      useClass: PrismaStoreTourRepository,
    },
    CreateStoreTourUseCase,
    UpdateStoreTourUseCase,
    DeleteStoreTourUseCase,
    GetStoreTourUseCase,
    GetBusinessStoreToursUseCase,
  ],
})
export class StoreTourModule {}
