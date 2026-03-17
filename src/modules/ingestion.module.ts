import { Module } from '@nestjs/common';
import { EventsModule } from './events.module';
import { IngestionService } from '@services/ingestion.service';
import { IngestionController } from '@controllers/ingestion.controller';
import { SimilarityEngine } from '@similarity/similarity-engine.service';
import { EventDateTimeMapper } from '@mappers/event-datetime.mapper';
import { TitleSimilarityRule } from '@rules/title-similarity.rule';
import { VenueSimilarityRule } from '@rules/venue-similarity.rule';
import { DateProximityRule } from '@rules/date-proximity.rule';
import { ExactMatchRule } from '@rules/exact-match.rule';
import { SIMILARITY_ENGINE } from '@ports/similarity-engine.port';

/**
 * Thin wiring module for the ingestion pipeline.
 *
 * Imports EventsModule to receive EVENT_CREATOR, CANDIDATE_REPOSITORY, and
 * TRANSACTION_MANAGER. Assembles the SIMILARITY_RULES array via a factory so
 * SimilarityEngine receives all rules without knowing their concrete types.
 *
 * No direct MikroORM or entity imports at this level.
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
