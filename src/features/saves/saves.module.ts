import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { SavesController } from './api/controllers/saves.controller.js';
import { SavesService } from './application/use-cases/saves.service.js';
import { SAVES_REPOSITORY } from './domain/ports/saves.repository.js';
import { PrismaSavesRepository } from './infrastructure/repositories/prisma-saves.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [SavesController],
  providers: [
    SavesService,
    {
      provide: SAVES_REPOSITORY,
      useClass: PrismaSavesRepository,
    },
  ],
  exports: [SavesService],
})
export class SavesModule {}
