import { Injectable, Inject, Logger } from '@nestjs/common';
import { SimilarityRule, SimilarityContext } from './similarity-rule.interface';
import { RuleEvaluator } from './rule-evaluator';
import { ISimilarityEngine } from './similarity-engine.port';
import {
  EventSummary,
  EventSubmission,
  SimilarityMatch,
} from '@application/types';
import {
  type IEventCandidateReader,
  EVENT_CANDIDATE_READER,
} from '@ports/events/event-candidate-reader.port';

@Injectable()
export class SimilarityEngine implements ISimilarityEngine {
  private readonly logger = new Logger(SimilarityEngine.name);
  private readonly evaluator: RuleEvaluator;
  private readonly SIMILARITY_THRESHOLD = 0.3;
  private readonly SEARCH_WINDOW_DAYS = 7;

  constructor(
    @Inject(EVENT_CANDIDATE_READER)
    private readonly candidateReader: IEventCandidateReader,
    @Inject('SIMILARITY_RULES')
    private readonly rules: SimilarityRule[],
  ) {
    this.evaluator = new RuleEvaluator(rules);
    this.logger.log(`SimilarityEngine ready with ${rules.length} rules`);
  }

  async findSimilar(submission: EventSubmission): Promise<SimilarityMatch[]> {
    this.logger.log(`Finding similar events for: "${submission.title}"`);
    const { from, to } = this.buildWindow(submission.datetime.date);
    const candidates = await this.candidateReader.findCandidatesInWindow(
      from,
      to,
    );
    this.logger.log(`${candidates.length} candidates in window`);
    if (!candidates.length) return [];

    const scored = await Promise.all(
      candidates.map((c) => this.scoreCandidate(c, submission)),
    );
    return scored
      .filter(
        (r): r is SimilarityMatch =>
          r !== null && r.score > this.SIMILARITY_THRESHOLD,
      )
      .sort((a, b) => b.score - a.score);
  }

  private buildWindow(date: Date): { from: Date; to: Date } {
    const from = new Date(date);
    from.setDate(from.getDate() - this.SEARCH_WINDOW_DAYS);
    const to = new Date(date);
    to.setDate(to.getDate() + this.SEARCH_WINDOW_DAYS);
    return { from, to };
  }

  private async scoreCandidate(
    candidate: EventSummary,
    submission: EventSubmission,
  ): Promise<SimilarityMatch | null> {
    try {
      const context: SimilarityContext = {
        submission,
        candidate,
        submissionDate: submission.datetime.date,
      };
      const exactRule = this.rules.find((r) => r.name === 'exact');
      if (exactRule?.calculate(context) === 1.0) {
        this.logger.log(`Exact match: ${candidate.id}`);
        return { event: candidate, score: 1.0, matches: { exact: true } };
      }
      return this.evaluator.score(candidate, context);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to score candidate ${candidate.id}: ${message}`,
      );
      return null;
    }
  }
}
