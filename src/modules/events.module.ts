import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Event } from '@infrastructure/entities/event.entity';
import { MikroOrmEventReaderAdapter } from '@infrastructure/adapters/mikro-orm-event-reader.adapter';
import { MikroOrmEventCreatorAdapter } from '@infrastructure/adapters/mikro-orm-event-creator.adapter';
import { MikroOrmEventMutatorAdapter } from '@infrastructure/adapters/mikro-orm-event-mutator.adapter';
import { MikroOrmCandidateRepositoryAdapter } from '@infrastructure/adapters/mikro-orm-candidate-repository.adapter';
import { MikroOrmTransactionManagerAdapter } from '@infrastructure/adapters/mikro-orm-transaction-manager.adapter';
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
 * Each port token maps to exactly one adapter class.
 * Exports all tokens so IngestionModule can consume them without
 * importing any concrete adapter class.
 *
 * | Token                | Adapter                              |
 * |----------------------|--------------------------------------|
 * | EVENT_READER         | MikroOrmEventReaderAdapter           |
 * | EVENT_CREATOR        | MikroOrmEventCreatorAdapter          |
 * | EVENT_MUTATOR        | MikroOrmEventMutatorAdapter          |
 * | CANDIDATE_REPOSITORY | MikroOrmCandidateRepositoryAdapter   |
 * | TRANSACTION_MANAGER  | MikroOrmTransactionManagerAdapter    |
 */
@Module({
  imports: [MikroOrmModule.forFeature([Event])],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventDateTimeAssembler,
    MikroOrmEventReaderAdapter,
    MikroOrmEventCreatorAdapter,
    MikroOrmEventMutatorAdapter,
    MikroOrmCandidateRepositoryAdapter,
    MikroOrmTransactionManagerAdapter,
    { provide: EVENT_READER, useExisting: MikroOrmEventReaderAdapter },
    { provide: EVENT_CREATOR, useExisting: MikroOrmEventCreatorAdapter },
    { provide: EVENT_MUTATOR, useExisting: MikroOrmEventMutatorAdapter },
    {
      provide: CANDIDATE_REPOSITORY,
      useExisting: MikroOrmCandidateRepositoryAdapter,
    },
    {
      provide: TRANSACTION_MANAGER,
      useExisting: MikroOrmTransactionManagerAdapter,
    },
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
