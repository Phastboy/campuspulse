import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { SimilarityEngine } from './similarity-engine.service';
import { TitleSimilarityRule } from './rules/title-similarity.rule';
import { VenueSimilarityRule } from './rules/venue-similarity.rule';
import { DateProximityRule } from './rules/date-proximity.rule';
import { ExactMatchRule } from './rules/exact-match.rule';
import { EventDateTimeMapper } from './mappers/event-datetime.mapper';
import { SIMILARITY_ENGINE } from './ports/similarity-engine.port';

/**
 * Feature module for the event ingestion pipeline.
 *
 * Imports {@link EventsModule} to receive `EVENT_WRITER`, `CANDIDATE_REPOSITORY`,
 * and `TRANSACTION_MANAGER` via its exports.
 *
 * No direct MikroORM or entity imports — all infrastructure comes through
 * the exported tokens from EventsModule.
 *
 * {@link EventDateTimeMapper} is now declared here (in `ingestion/mappers/`)
 * rather than in `EventsModule` — it maps ingestion DTOs and belongs here.
 */
@Module({
  imports: [EventsModule],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    EventDateTimeMapper,
    SimilarityEngine,
    { provide: SIMILARITY_ENGINE, useExisting: SimilarityEngine },
    TitleSimilarityRule,
    VenueSimilarityRule,
    DateProximityRule,
    ExactMatchRule,
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
  ],
})
export class IngestionModule {}
