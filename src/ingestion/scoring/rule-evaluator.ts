import { Logger } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../interfaces/similarity-rule.interface';

/** Outcome of running a single rule against a candidate. */
export interface RuleOutcome {
  name: string;
  score: number;
  weight: number;
  /** Whether the score exceeded the match threshold — set by the caller. */
  matched: boolean;
  /** `true` if this rule was skipped or failed. */
  skipped: boolean;
}

/** Aggregated result from all rules for a single candidate. */
export interface AggregateScore {
  finalScore: number;
  ruleScores: Record<string, number>;
  matches: Record<string, boolean>;
}

/**
 * Evaluates a set of {@link SimilarityRule} instances against a single context
 * and aggregates the results into a weighted score.
 *
 * **Strategy pattern:** rules are injected as strategies — this class
 * orchestrates their execution but knows nothing about what each rule measures.
 *
 * **Single Responsibility:** owns only rule execution and score aggregation.
 * Candidate fetching, window calculation, and result filtering remain in
 * {@link SimilarityEngine}.
 *
 * All rules run concurrently via `Promise.allSettled`. A failing rule is
 * logged and excluded from the weighted average without affecting other rules.
 */
export class RuleEvaluator {
  private readonly MATCH_THRESHOLD = 0.7;
  private readonly logger = new Logger(RuleEvaluator.name);

  constructor(private readonly rules: SimilarityRule[]) {}

  /**
   * Runs all non-exact rules concurrently and returns the aggregated score.
   *
   * @param context - Scoring context for the current candidate
   * @returns Aggregated score with per-rule breakdown and match flags
   */
  async evaluate(context: SimilarityContext): Promise<AggregateScore> {
    const eligible = this.rules.filter((r) => r.name !== 'exact');

    const outcomes = await Promise.allSettled(
      eligible.map((rule) => this.runRule(rule, context)),
    );

    return this.aggregate(outcomes, context.candidate.id);
  }

  /**
   * Runs a single rule — checks applicability first, then calculates score.
   * Returns `null` if the rule is not applicable.
   */
  private async runRule(
    rule: SimilarityRule,
    context: SimilarityContext,
  ): Promise<RuleOutcome | null> {
    // Applicability guard
    if (rule.isApplicable) {
      try {
        if (!rule.isApplicable(context)) {
          this.logger.debug(`Rule "${rule.name}" not applicable`);
          return null;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Applicability check failed for "${rule.name}": ${message}`,
        );
        return null;
      }
    }

    // Score calculation
    const rawScore = rule.calculate(context);
    const score = Math.max(0, Math.min(1, rawScore));

    if (rawScore !== score) {
      this.logger.warn(
        `Rule "${rule.name}" returned ${rawScore} — clamped to ${score}`,
      );
    }

    return {
      name: rule.name,
      score,
      weight: Math.abs(rule.weight),
      matched: score > this.MATCH_THRESHOLD,
      skipped: false,
    };
  }

  /**
   * Aggregates settled rule outcomes into a single weighted score.
   * Rejected promises and null outcomes are logged and excluded.
   */
  private aggregate(
    settled: PromiseSettledResult<RuleOutcome | null>[],
    candidateId: string,
  ): AggregateScore {
    let totalWeight = 0;
    let weightedSum = 0;
    const ruleScores: Record<string, number> = {};
    const matches: Record<string, boolean> = {};
    const failed: string[] = [];

    for (const result of settled) {
      if (result.status === 'rejected') {
        failed.push('unknown (promise rejected)');
        continue;
      }

      const outcome = result.value;
      if (!outcome) continue; // null = not applicable, skip silently

      ruleScores[outcome.name] = outcome.score;
      if (outcome.matched) matches[outcome.name] = true;

      weightedSum += outcome.score * outcome.weight;
      totalWeight += outcome.weight;

      this.logger.debug(`Rule "${outcome.name}": ${outcome.score.toFixed(3)}`);
    }

    if (failed.length > 0) {
      this.logger.warn(
        `${failed.length} rule(s) failed for ${candidateId}: ${failed.join(', ')}`,
      );
    }

    const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      finalScore: Math.round(finalScore * 100) / 100,
      ruleScores,
      matches,
    };
  }
}
