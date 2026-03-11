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

@Module({
  imports: [MikroOrmModule.forFeature([Event])],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    SimilarityEngine,
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
