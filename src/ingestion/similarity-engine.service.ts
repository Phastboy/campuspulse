import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  SimilarityRule,
  SimilarityContext,
} from './interfaces/similarity-rule.interface';
import { Event } from '@events/entities/event.entity';
import { EventSubmission } from '@events/domain';

export interface ScoredEvent {
  event: {
    id: string;
    title: string;
    datetime: Event['datetime'];
    venue: string;
  };
  score: number;
  matches: Record<string, boolean>;
  ruleScores: Record<string, number>;
}

@Injectable()
export class SimilarityEngine {
  private readonly logger = new Logger(SimilarityEngine.name);
  private readonly CONCURRENCY_LIMIT = 10;

  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: EntityRepository<Event>,

    @Inject('SIMILARITY_RULES')
    private readonly rules: SimilarityRule[],
  ) {
    this.logger.log(`SimilarityEngine initialized with ${rules.length} rules`);
    this.logger.debug('Rules loaded: ' + rules.map((r) => r.name).join(', '));
  }

  private async mapConcurrent<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    concurrency: number = this.CONCURRENCY_LIMIT,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      const chunkResults = await Promise.all(chunk.map(fn));
      results.push(...chunkResults);

      if (items.length > 100) {
        this.logger.debug(
          `Processed ${Math.min(i + concurrency, items.length)}/${items.length} candidates`,
        );
      }
    }

    return results;
  }

  async findSimilar(submission: EventSubmission): Promise<ScoredEvent[]> {
    this.logger.log('Finding similar events for submission');

    const submissionDate = submission.datetime.date;

    const startDate = new Date(submissionDate);
    startDate.setDate(startDate.getDate() - 7);

    const endDate = new Date(submissionDate);
    endDate.setDate(endDate.getDate() + 7);

    this.logger.debug(`Submission date: ${submissionDate.toISOString()}`);
    this.logger.debug(
      `Search range: ${startDate.toISOString()} → ${endDate.toISOString()}`,
    );

    try {
      const qb = this.eventRepo.createQueryBuilder('e');

      const candidates = await qb
        .select('*')
        .where(`(e.datetime->>'date')::timestamptz BETWEEN ? AND ?`, [
          startDate,
          endDate,
        ])
        .getResult();

      this.logger.log(`Found ${candidates.length} candidate events`);

      if (!candidates.length) {
        this.logger.debug('No candidates found, returning empty array');
        return [];
      }

      this.logger.debug(
        `Candidate IDs: ${candidates.map((c) => c.id).join(', ')}`,
      );

      const scored = await this.mapConcurrent(candidates, async (candidate) => {
        try {
          return await this.scoreCandidate(candidate, submission);
        } catch (error) {
          const err = error as Error;
          this.logger.error(`Failed to score candidate ${candidate.id}`);
          this.logger.error(err.message);
          this.logger.error(err.stack);
          return null;
        }
      });

      const validResults = scored
        .filter(
          (result): result is ScoredEvent =>
            result !== null && result.score > 0.3,
        )
        .sort((a, b) => b.score - a.score);

      this.logger.log(
        `Returning ${validResults.length} candidates above similarity threshold`,
      );

      if (validResults.length) {
        this.logger.debug(
          `Top match: ${validResults[0].event.title} (${validResults[0].score})`,
        );

        this.logger.debug('Top match rule scores:');
        Object.entries(validResults[0].ruleScores).forEach(([rule, score]) => {
          this.logger.debug(`  ${rule}: ${score.toFixed(3)}`);
        });
      }

      return validResults;
    } catch (error) {
      const err = error as Error;

      this.logger.error('Error finding similar events');
      this.logger.error(`Error type: ${err.name}`);
      this.logger.error(`Error message: ${err.message}`);
      this.logger.error(`Error stack: ${err.stack}`);

      this.logger.error('Submission that caused error:');
      this.logger.error(JSON.stringify(submission, null, 2));

      throw err;
    }
  }

  private scoreCandidate(
    candidate: Event,
    submission: EventSubmission,
  ): ScoredEvent {
    this.logger.debug(`Scoring candidate: ${candidate.id}`);

    const context: SimilarityContext = {
      submission,
      candidate,
      submissionDate: submission.datetime.date,
    };

    // STEP 1: Check for exact match first (short-circuit)
    const exactRule = this.rules.find((r) => r.name === 'exact');
    if (exactRule) {
      try {
        const exactScore = exactRule.calculate(context);

        if (exactScore === 1.0) {
          this.logger.log(
            `🎯 Exact match found for candidate ${candidate.id} - short-circuiting`,
          );

          // Return immediately with only exact match data
          return {
            event: {
              id: candidate.id,
              title: candidate.title,
              datetime: candidate.datetime,
              venue: candidate.venue,
            },
            score: 1.0,
            matches: { exact: true },
            ruleScores: { exact: 1.0 }, // Only exact rule matters
          };
        }
      } catch (error) {
        this.logger.error(`Exact rule failed for candidate ${candidate.id}`);
      }
    }

    // STEP 2: Normal scoring for non-exact matches
    this.logger.debug(
      `No exact match for candidate ${candidate.id}, calculating full score`,
    );

    let totalWeight = 0;
    let weightedScore = 0;
    const ruleScores: Record<string, number> = {};
    const failedRules: string[] = [];

    for (const rule of this.rules) {
      if (rule.name === 'exact') continue;

      if (rule.isApplicable) {
        try {
          if (!rule.isApplicable(context)) {
            this.logger.debug(
              `Rule "${rule.name}" not applicable for candidate ${candidate.id}`,
            );
            continue;
          }
        } catch (error) {
          const err = error as Error;
          this.logger.error(
            `Error checking applicability for rule "${rule.name}"`,
          );
          this.logger.error(err.message);
          failedRules.push(rule.name);
          continue;
        }
      }

      try {
        const score = rule.calculate(context);

        if (score < 0 || score > 1) {
          this.logger.warn(
            `Rule "${rule.name}" returned score ${score} outside [0,1] range - clamping`,
          );
          ruleScores[rule.name] = Math.max(0, Math.min(1, score));
        } else {
          ruleScores[rule.name] = score;
        }

        weightedScore += score * Math.abs(rule.weight);
        totalWeight += Math.abs(rule.weight);

        this.logger.debug(
          `Rule "${rule.name}" score: ${score.toFixed(3)} (weight: ${rule.weight})`,
        );
      } catch (err) {
        const error = err as Error;
        this.logger.error(
          `Rule "${rule.name}" failed for candidate ${candidate.id}`,
        );
        this.logger.error(`Error: ${error.message}`);
        this.logger.error(`Stack: ${error.stack}`);
        this.logger.error(`  Submission title: ${context.submission.title}`);
        this.logger.error(`  Candidate title: ${context.candidate.title}`);
        this.logger.error(
          `  Submission date: ${context.submissionDate.toISOString()}`,
        );
        failedRules.push(rule.name);
      }
    }

    if (failedRules.length > 0) {
      this.logger.warn(
        `Candidate ${candidate.id}: ${failedRules.length} rules failed: ${failedRules.join(', ')}`,
      );
    }

    const finalScore = totalWeight ? weightedScore / totalWeight : 0;
    const matches: Record<string, boolean> = {};

    for (const [name, score] of Object.entries(ruleScores)) {
      if (score > 0.7) {
        matches[name] = true;
      }
    }

    this.logger.debug(
      `Candidate ${candidate.id} final score: ${finalScore.toFixed(3)}`,
    );

    return {
      event: {
        id: candidate.id,
        title: candidate.title,
        datetime: candidate.datetime,
        venue: candidate.venue,
      },
      score: Math.round(finalScore * 100) / 100,
      matches,
      ruleScores,
    };
  }
}
