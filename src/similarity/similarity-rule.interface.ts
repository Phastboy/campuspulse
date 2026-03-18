import { EventSubmission, EventSummary } from '@application/types';

/**
 * All data available to a similarity rule during scoring.
 *
 * Rules read only from this context — it contains exactly what they need.
 * `candidate` is typed as {@link EventSummary}, not the full ORM entity,
 * so rules have zero dependency on MikroORM.
 */
export interface SimilarityContext {
  submission: EventSubmission;
  candidate: EventSummary;
  /** Pre-extracted convenience alias for `submission.datetime.date`. */
  submissionDate: Date;
}

/**
 * Contract for a single duplicate-detection rule.
 *
 * Rules are assembled via the `SIMILARITY_RULES` injection token in
 * {@link IngestionModule} and executed by {@link SimilarityEngine}.
 *
 * Adding a new rule: implement this interface, mark `@Injectable()`, add to
 * `IngestionModule` providers and the `SIMILARITY_RULES` factory. No changes
 * to `SimilarityEngine` or `RuleEvaluator` are required — Open/Closed.
 */
export interface SimilarityRule {
  /** Unique name. The special value `"exact"` enables the short-circuit path. */
  readonly name: string;
  /** Relative weight in the weighted average. Engine normalises these. */
  readonly weight: number;
  /** Returns a score in `[0, 1]`. Values outside are clamped by the engine. */
  calculate(context: SimilarityContext): number;
  /** Optional guard — return `false` to skip this rule for a given context. */
  isApplicable?(context: SimilarityContext): boolean;
}
