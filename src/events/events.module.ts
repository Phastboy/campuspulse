import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { MikroOrmEventRepository } from './repositories/mikro-orm-event.repository';
import { MikroOrmTransactionManager } from './repositories/mikro-orm-transaction-manager';
import { EventDateTimeAssembler } from './mappers/event-datetime.assembler';
import { EVENT_READER } from './ports/event-reader.port';
import { EVENT_CREATOR } from './ports/event-creator.port';
import { EVENT_MUTATOR } from './ports/event-mutator.port';
import { CANDIDATE_REPOSITORY } from '../ingestion/ports/candidate-repository.port';
import { TRANSACTION_MANAGER } from '../common/ports/transaction-manager.port';

/**
 * Feature module for published events.
 *
 * `MikroOrmEventRepository` implements four segregated port interfaces and is
 * registered under four tokens so each consumer receives only the interface
 * it needs:
 *
 * | Token                | Consumer          | Methods exposed          |
 * |----------------------|-------------------|--------------------------|
 * | `EVENT_READER`       | `EventsService`   | findAll, findById, ...   |
 * | `EVENT_MUTATOR`      | `EventsService`   | save, remove             |
 * | `EVENT_CREATOR`      | `IngestionService`| create                   |
 * | `CANDIDATE_REPOSITORY` | `SimilarityEngine` | findCandidatesInWindow |
 */
@Module({
  imports: [MikroOrmModule.forFeature([Event])],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventDateTimeAssembler,
    MikroOrmEventRepository,
    MikroOrmTransactionManager,
    { provide: EVENT_READER, useExisting: MikroOrmEventRepository },
    { provide: EVENT_CREATOR, useExisting: MikroOrmEventRepository },
    { provide: EVENT_MUTATOR, useExisting: MikroOrmEventRepository },
    { provide: CANDIDATE_REPOSITORY, useExisting: MikroOrmEventRepository },
    { provide: TRANSACTION_MANAGER, useExisting: MikroOrmTransactionManager },
  ],
  exports: [
    EVENT_READER,
    EVENT_CREATOR,
    EVENT_MUTATOR,
    CANDIDATE_REPOSITORY,
    TRANSACTION_MANAGER,
  ],
})
export class EventsModule {}
