import { Logger } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../interfaces/similarity-rule.interface';
import { ScoredEvent } from '../dto/similarity.dto';

/** Result from a single rule execution. */
interface RuleOutcome {
  name: string;
  score: number;
  weight: number;
  matched: boolean;
}

/**
 * Aggregated scoring result for a single candidate.
 *
 * `ruleScores` is diagnostic data — used for logging and for populating
 * `matches`, then discarded before the result leaves this class. It never
 * surfaces in the port contract or in any HTTP response.
 */
interface AggregateScore {
  score: number;
  matches: Record<string, boolean>;
}

/**
 * Evaluates all similarity rules against a single context and returns a
 * fully assembled {@link ScoredEvent} ready to return to callers.
 *
 * All rules run concurrently via `Promise.allSettled`. A failing rule is
 * logged and excluded from the weighted average without affecting others.
 *
 * Diagnostic `ruleScores` are logged here — the only place that needs them —
 * and never leave this class, eliminating the need for `InternalScoredEvent`
 * in {@link SimilarityEngine}.
 */
export class RuleEvaluator {
  private readonly MATCH_THRESHOLD = 0.7;
  private readonly logger = new Logger(RuleEvaluator.name);

  constructor(private readonly rules: SimilarityRule[]) {}

  /**
   * Runs all non-exact rules concurrently, aggregates the result, logs
   * per-rule diagnostics, and returns a complete {@link ScoredEvent}.
   *
   * @param candidate - The candidate event being scored
   * @param context   - Full scoring context
   */
  async score(
    candidate: ScoredEvent['event'],
    context: SimilarityContext,
  ): Promise<ScoredEvent> {
    const eligible = this.rules.filter((r) => r.name !== 'exact');

    const settled = await Promise.allSettled(
      eligible.map((rule) => this.runRule(rule, context)),
    );

    const { score, matches } = this.aggregate(settled, candidate.id);

    return { event: candidate, score, matches };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async runRule(
    rule: SimilarityRule,
    context: SimilarityContext,
  ): Promise<RuleOutcome | null> {
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
    };
  }

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
      if (!outcome) continue;

      ruleScores[outcome.name] = outcome.score;
      if (outcome.matched) matches[outcome.name] = true;

      weightedSum += outcome.score * outcome.weight;
      totalWeight += outcome.weight;

      // Diagnostic logging — ruleScores exist here and only here
      this.logger.debug(`  ${outcome.name}: ${outcome.score.toFixed(3)}`);
    }

    if (failed.length > 0) {
      this.logger.warn(
        `${failed.length} rule(s) failed for ${candidateId}: ${failed.join(', ')}`,
      );
    }

    const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      score: Math.round(finalScore * 100) / 100,
      matches,
    };
  }
}
