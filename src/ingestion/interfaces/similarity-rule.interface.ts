import { EventSubmission } from '@events/domain';
import { Event } from '../../events/entities/event.entity';

/**
 * All data available to a similarity rule during scoring.
 *
 * Passed to every {@link SimilarityRule.calculate} call. Rules should read
 * from this context rather than accepting individual parameters, so the
 * interface can be extended without changing rule signatures.
 */
export interface SimilarityContext {
  /** The incoming event submission being evaluated. */
  submission: EventSubmission;

  /** The existing database event being compared against. */
  candidate: Event;

  /**
   * Convenience alias for `submission.datetime.date`.
   * Pre-extracted so rules do not need to navigate the union type themselves.
   */
  submissionDate: Date;
}

/**
 * Contract for a single duplicate-detection rule.
 *
 * Rules are registered in {@link IngestionModule} via the `SIMILARITY_RULES`
 * injection token and executed by {@link SimilarityEngine}. Each rule returns
 * a score in `[0, 1]` for a given (submission, candidate) pair.
 *
 * **Adding a new rule:**
 * 1. Create a class implementing this interface (mark it `@Injectable()`)
 * 2. Add it to `IngestionModule` providers
 * 3. Inject it into the `SIMILARITY_RULES` factory
 *
 * No changes to `SimilarityEngine` are required — Open/Closed principle.
 *
 * @example
 * ```ts
 * @Injectable()
 * export class CategoryMatchRule implements SimilarityRule {
 *   name = 'category';
 *   weight = 0.15;
 *
 *   calculate(context: SimilarityContext): number {
 *     return context.submission.category === context.candidate.category ? 1 : 0;
 *   }
 * }
 * ```
 */
export interface SimilarityRule {
  /**
   * Unique identifier for this rule.
   * Used in log output and the internal `ruleScores` debug map.
   * The special name `"exact"` enables the short-circuit path in `SimilarityEngine`.
   */
  readonly name: string;

  /**
   * Relative importance of this rule in the weighted average.
   * The engine normalises weights so they do not need to sum to 1.
   *
   * @example 0.5 // title similarity — highest weight
   * @example 0.3 // venue similarity
   * @example 0.2 // date proximity
   */
  readonly weight: number;

  /**
   * Compute a similarity score between the submission and candidate.
   *
   * @param context - Scoring context with submission and candidate
   * @returns Score in `[0, 1]`. Values outside this range are clamped by the engine.
   */
  calculate(context: SimilarityContext): number;

  /**
   * Optional guard to skip this rule when its inputs are not available.
   *
   * When defined and returns `false`, the rule is excluded from scoring and
   * does not contribute to the weighted average. This keeps the denominator
   * accurate — a rule that cannot run should not reduce the total weight.
   *
   * @param context - Scoring context
   * @returns `true` if the rule should run; `false` to skip
   *
   * @example
   * // Skip date scoring if submission date is invalid
   * isApplicable(context) {
   *   return context.submissionDate instanceof Date && !isNaN(context.submissionDate.getTime());
   * }
   */
  isApplicable?(context: SimilarityContext): boolean;
}
