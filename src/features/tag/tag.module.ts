import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { TagController } from './api/controllers/tag.controller.js';
import { CreateTagUseCase } from './application/use-cases/create-tag.use-case.js';
import { DeleteTagUseCase } from './application/use-cases/delete-tag.use-case.js';
import { GetTagUseCase } from './application/use-cases/get-tag.use-case.js';
import { ListTagsUseCase } from './application/use-cases/list-tags.use-case.js';
import { UpdateTagUseCase } from './application/use-cases/update-tag.use-case.js';
import { ITagRepository } from './domain/ports/tag.repository.port.js';
import { PrismaTagRepository } from './infrastructure/prisma-tag.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [TagController],
  providers: [
    {
      provide: ITagRepository,
      useClass: PrismaTagRepository,
    },
    CreateTagUseCase,
    UpdateTagUseCase,
    DeleteTagUseCase,
    GetTagUseCase,
    ListTagsUseCase,
  ],
  exports: [ITagRepository],
})
export class TagModule {}
