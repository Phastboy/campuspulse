import { EventSubmission } from '@events/domain';
import { EventSummary } from '@events/domain/event-summary';

/**
 * All data available to a similarity rule during scoring.
 *
 * Passed to every {@link SimilarityRule.calculate} call. Rules should read
 * only from this context — it contains exactly what rules need and nothing more.
 *
 * **ISP note:** `candidate` was previously typed as the full `Event` ORM entity,
 * exposing `createdAt`, MikroORM decorators, and persistence-specific fields
 * that no rule needs. Rules now receive {@link EventSummary} — the minimal
 * persistence-free projection containing only `id`, `title`, `datetime`, and
 * `venue`. Rules are decoupled from the ORM entity entirely.
 *
 * **LSP note:** this change also removes an implicit dependency on MikroORM
 * from every rule — `EventSummary` can be constructed from any persistence
 * layer, so rules remain substitutable regardless of ORM choice.
 */
export interface SimilarityContext {
  /** The incoming event submission being evaluated. */
  submission: EventSubmission;

  /**
   * The existing event being compared against.
   *
   * Typed as {@link EventSummary} (not the full `Event` entity) so rules
   * depend only on the minimal identity projection, not on ORM internals.
   */
  candidate: EventSummary;

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
 *   readonly name: string = 'category';
 *   readonly weight: number = 0.15;
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
   */
  readonly weight: number;

  /**
   * Computes a similarity score between the submission and candidate.
   *
   * @param context - Scoring context with submission and candidate summary
   * @returns Score in `[0, 1]`. Values outside this range are clamped by the engine.
   */
  calculate(context: SimilarityContext): number;

  /**
   * Optional guard to skip this rule when its inputs are not available.
   *
   * When defined and returns `false`, the rule is excluded from scoring and
   * does not contribute to the weighted average — the denominator stays
   * accurate because an inapplicable rule contributes zero weight.
   *
   * @param context - Scoring context
   * @returns `true` if the rule should run; `false` to skip
   */
  isApplicable?(context: SimilarityContext): boolean;
}
