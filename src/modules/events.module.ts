import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Event } from '@infrastructure/entities/event.entity';
import { MikroOrmEventRepository } from '@infrastructure/repositories/mikro-orm-event.repository';
import { MikroOrmTransactionManager } from '@infrastructure/repositories/mikro-orm-transaction-manager';
import { EventsService } from '@services/events.service';
import { EventsController } from '@controllers/events.controller';
import { EventDateTimeAssembler } from '@mappers/event-datetime.assembler';
import { EVENT_READER } from '@ports/event-reader.port';
import { EVENT_CREATOR } from '@ports/event-creator.port';
import { EVENT_MUTATOR } from '@ports/event-mutator.port';
import { CANDIDATE_REPOSITORY } from '@ports/candidate-repository.port';
import { TRANSACTION_MANAGER } from '@ports/transaction-manager.port';

/**
 * Thin wiring module for the events domain.
 *
 * Registers `MikroOrmEventRepository` under four segregated port tokens so
 * each consumer receives only the interface it needs. Exports all tokens for
 * use by `IngestionModule`.
 *
 * | Token                  | Interface              | Consumer           |
 * |------------------------|------------------------|--------------------|
 * | EVENT_READER           | IEventReader           | EventsService      |
 * | EVENT_MUTATOR          | IEventMutator          | EventsService      |
 * | EVENT_CREATOR          | IEventCreator          | IngestionService   |
 * | CANDIDATE_REPOSITORY   | ICandidateRepository   | SimilarityEngine   |
 * | TRANSACTION_MANAGER    | ITransactionManager    | IngestionService   |
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
