import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Event } from '@infrastructure/entities/event.entity';

import { MikroOrmEventReaderAdapter } from '@infrastructure/adapters/events/mikro-orm-event-reader.adapter';
import { MikroOrmEventWriterAdapter } from '@infrastructure/adapters/events/mikro-orm-event-writer.adapter';
import { MikroOrmEventCandidateReaderAdapter } from '@infrastructure/adapters/events/mikro-orm-event-candidate-reader.adapter';
import { MikroOrmTransactionManagerAdapter } from '@infrastructure/adapters/events/mikro-orm-transaction-manager.adapter';

import { EventsReadService } from '@services/events/events-read.service';
import { EventsWriteService } from '@services/events/events-write.service';
import { SimilarityEngine } from '@services/events/similarity/similarity-engine.service';

import { TitleSimilarityRule } from '@services/events/similarity/rules/title-similarity.rule';
import { VenueSimilarityRule } from '@services/events/similarity/rules/venue-similarity.rule';
import { DateProximityRule } from '@services/events/similarity/rules/date-proximity.rule';
import { ExactMatchRule } from '@services/events/similarity/rules/exact-match.rule';

import { EventsReadController } from '@controllers/events/events-read.controller';
import { EventsWriteController } from '@controllers/events/events-write.controller';

import { EventDateTimeAssembler } from '@mappers/event-datetime.assembler';
import { EventDateTimeMapper } from '@mappers/event-datetime.mapper';

import { EVENT_READER } from '@ports/events/event-reader.port';
import { EVENT_WRITER } from '@ports/events/event-writer.port';
import { EVENT_CANDIDATE_READER } from '@ports/events/event-candidate-reader.port';
import { TRANSACTION_MANAGER } from '@ports/transaction-manager.port';
import { SIMILARITY_ENGINE } from '@services/events/similarity/similarity-engine.port';

/**
 * Single module for all event use cases — reads, writes, and the duplicate-
 * detection pipeline that guards writes.
 *
 * | Token                  | Adapter / Service                    |
 * |------------------------|--------------------------------------|
 * | EVENT_READER           | MikroOrmEventReaderAdapter           |
 * | EVENT_WRITER           | MikroOrmEventWriterAdapter           |
 * | EVENT_CANDIDATE_READER | MikroOrmEventCandidateReaderAdapter  |
 * | TRANSACTION_MANAGER    | MikroOrmTransactionManagerAdapter    |
 * | SIMILARITY_ENGINE      | SimilarityEngine                     |
 */
@Module({
  imports: [MikroOrmModule.forFeature([Event])],
  controllers: [EventsReadController, EventsWriteController],
  providers: [
    // Services
    EventsReadService,
    EventsWriteService,
    SimilarityEngine,
    // Mappers
    EventDateTimeAssembler,
    EventDateTimeMapper,
    // Rules
    ExactMatchRule,
    TitleSimilarityRule,
    VenueSimilarityRule,
    DateProximityRule,
    {
      provide: 'SIMILARITY_RULES',
      useFactory: (
        exact: ExactMatchRule,
        title: TitleSimilarityRule,
        venue: VenueSimilarityRule,
        date: DateProximityRule,
      ) => [exact, title, venue, date],
      inject: [
        ExactMatchRule,
        TitleSimilarityRule,
        VenueSimilarityRule,
        DateProximityRule,
      ],
    },
    // Adapters
    MikroOrmEventReaderAdapter,
    MikroOrmEventWriterAdapter,
    MikroOrmEventCandidateReaderAdapter,
    MikroOrmTransactionManagerAdapter,
    // Port tokens
    { provide: EVENT_READER, useExisting: MikroOrmEventReaderAdapter },
    { provide: EVENT_WRITER, useExisting: MikroOrmEventWriterAdapter },
    {
      provide: EVENT_CANDIDATE_READER,
      useExisting: MikroOrmEventCandidateReaderAdapter,
    },
    {
      provide: TRANSACTION_MANAGER,
      useExisting: MikroOrmTransactionManagerAdapter,
    },
    { provide: SIMILARITY_ENGINE, useExisting: SimilarityEngine },
  ],
})
export class EventsModule {}
