import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { SimilarityEngine } from './similarity-engine.service';
import { TitleSimilarityRule } from './rules/title-similarity.rule';
import { VenueSimilarityRule } from './rules/venue-similarity.rule';
import { DateProximityRule } from './rules/date-proximity.rule';
import { ExactMatchRule } from './rules/exact-match.rule';
import { Event } from '../events/entities/event.entity';

/**
 * Feature module for the event ingestion pipeline.
 *
 * Owns the two-step submission flow (`submit` → `confirm`) and the similarity
 * engine that powers duplicate detection.
 *
 * **Similarity rules** are registered as individual providers and collected
 * into the `SIMILARITY_RULES` injection token via a factory. The order in
 * the array controls evaluation order inside `SimilarityEngine.scoreCandidate`,
 * though the `"exact"` rule is always short-circuited first regardless of
 * position.
 *
 * **Adding a new rule:**
 * 1. Create a class implementing {@link SimilarityRule} (mark it `@Injectable()`)
 * 2. Add it to `providers` below
 * 3. Add it to the `useFactory` parameters and `inject` array
 *
 * No changes to {@link SimilarityEngine} are required.
 */
@Module({
  imports: [MikroOrmModule.forFeature([Event])],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    SimilarityEngine,
    // ── Similarity rules ──────────────────────────────────────────────────
    TitleSimilarityRule,
    VenueSimilarityRule,
    DateProximityRule,
    ExactMatchRule,
    {
      provide: 'SIMILARITY_RULES',
      useFactory: (
        title: TitleSimilarityRule,
        venue: VenueSimilarityRule,
        date: DateProximityRule,
        exact: ExactMatchRule,
      ) => [title, venue, date, exact],
      inject: [
        TitleSimilarityRule,
        VenueSimilarityRule,
        DateProximityRule,
        ExactMatchRule,
      ],
    },
  ],
})
export class IngestionModule {}
