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

  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: EntityRepository<Event>,

    @Inject('SIMILARITY_RULES')
    private readonly rules: SimilarityRule[],
  ) {
    this.logger.log(`SimilarityEngine initialized with ${rules.length} rules`);
    this.logger.debug('Rules loaded: ' + rules.map(r => r.name).join(', '));
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
        .where(
          `(e.datetime->>'date')::timestamptz BETWEEN ? AND ?`,
          [startDate, endDate],
        )
        .getResult();

      this.logger.log(`Found ${candidates.length} candidate events`);

      if (!candidates.length) {
        this.logger.debug('No candidates found, returning empty array');
        return [];
      }

      // Log candidate IDs for traceability
      this.logger.debug(`Candidate IDs: ${candidates.map(c => c.id).join(', ')}`);

      const scored = candidates
        .map(candidate => {
          try {
            return this.scoreCandidate(candidate, submission);
          } catch (error) {
            const err = error as Error;
            this.logger.error(`Failed to score candidate ${candidate.id}`);
            this.logger.error(err.message);
            this.logger.error(err.stack);
            return null; // Skip this candidate
          }
        })
        .filter((result): result is ScoredEvent =>
          result !== null && result.score > 0.3
        )
        .sort((a, b) => b.score - a.score);

      this.logger.log(
        `Returning ${scored.length} candidates above similarity threshold`,
      );

      if (scored.length) {
        this.logger.debug(
          `Top match: ${scored[0].event.title} (${scored[0].score})`,
        );

        // Log detailed breakdown of top match
        this.logger.debug('Top match rule scores:');
        Object.entries(scored[0].ruleScores).forEach(([rule, score]) => {
          this.logger.debug(`  ${rule}: ${score.toFixed(3)}`);
        });
      }

      return scored;
    } catch (error) {
      const err = error as Error;

      this.logger.error('Error finding similar events');
      this.logger.error(`Error type: ${err.name}`);
      this.logger.error(`Error message: ${err.message}`);
      this.logger.error(`Error stack: ${err.stack}`);

      // Log submission details for debugging
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

    let totalWeight = 0;
    let weightedScore = 0;

    const ruleScores: Record<string, number> = {};
    const failedRules: string[] = [];

    for (const rule of this.rules) {
      // Check applicability
      if (rule.isApplicable) {
        try {
          if (!rule.isApplicable(context)) {
            this.logger.debug(`Rule "${rule.name}" not applicable for candidate ${candidate.id}`);
            continue;
          }
        } catch (error) {
          const err = error as Error;
          this.logger.error(`Error checking applicability for rule "${rule.name}"`);
          this.logger.error(err.message);
          failedRules.push(rule.name);
          continue;
        }
      }

      // Calculate score
      try {
        const score = rule.calculate(context);

        // Validate score range
        if (score < 0 || score > 1) {
          this.logger.warn(`Rule "${rule.name}" returned score ${score} outside [0,1] range - clamping`);
          ruleScores[rule.name] = Math.max(0, Math.min(1, score));
        } else {
          ruleScores[rule.name] = score;
        }

        weightedScore += score * Math.abs(rule.weight);
        totalWeight += Math.abs(rule.weight);

        this.logger.debug(`Rule "${rule.name}" score: ${score.toFixed(3)} (weight: ${rule.weight})`);
      } catch (err) {
        const error = err as Error;

        // Log detailed error information
        this.logger.error(`Rule "${rule.name}" failed for candidate ${candidate.id}`);
        this.logger.error(`Error: ${error.message}`);
        this.logger.error(`Stack: ${error.stack}`);

        // Log context that caused the error
        this.logger.error('Context at time of failure:');
        this.logger.error(`  Submission title: ${context.submission.title}`);
        this.logger.error(`  Candidate title: ${context.candidate.title}`);
        this.logger.error(`  Submission date: ${context.submissionDate.toISOString()}`);

        failedRules.push(rule.name);
      }
    }

    // Log if any rules failed
    if (failedRules.length > 0) {
      this.logger.warn(`Candidate ${candidate.id}: ${failedRules.length} rules failed: ${failedRules.join(', ')}`);
    }

    const finalScore = totalWeight ? weightedScore / totalWeight : 0;

    const matches: Record<string, boolean> = {};

    for (const [name, score] of Object.entries(ruleScores)) {
      if (score > 0.7) {
        matches[name] = true;
      }
    }

    this.logger.debug(`Candidate ${candidate.id} final score: ${finalScore.toFixed(3)}`);

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
