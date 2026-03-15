import {
  SimilarityRule,
  SimilarityContext,
} from '../../interfaces/similarity-rule.interface';

/**
 * Abstract base for string-field similarity rules.
 *
 * **Template Method pattern:** defines the full scoring algorithm once.
 * Subclasses implement only two things:
 * - `extractField` — which string to pull from the context
 * - `normalisationPattern` — which characters to strip/replace during normalisation
 *
 * Algorithm (evaluated in order, first match wins):
 * 1. Exact match after normalisation → `1.0`
 * 2. Substring containment → ratio of shorter/longer length
 * 3. Jaccard word overlap → `|A ∩ B| / |A ∪ B|`
 *
 * This eliminates the duplicated `normalise()` method and Jaccard logic
 * that previously existed in both {@link TitleSimilarityRule} and
 * {@link VenueSimilarityRule}.
 */
export abstract class TextSimilarityRule implements SimilarityRule {
  abstract readonly name: string;
  abstract readonly weight: number;

  /**
   * Extract the string field to compare from the scoring context.
   * Called twice per score — once for submission, once for candidate.
   */
  protected abstract extractField(
    context: SimilarityContext,
    side: 'submission' | 'candidate',
  ): string;

  /**
   * Regex pattern applied to replace noise characters during normalisation.
   * Matched characters are replaced with a space (or empty string).
   *
   * @example /[^\w\s]/g  — keep word chars and spaces (title rules)
   * @example /[^\w\s]/g  — strip all non-word chars (venue rules)
   */
  protected abstract noisePattern: RegExp;

  /**
   * Score for a substring containment match.
   * Override to `0.9` in venue rules where partial names are common.
   * Defaults to length ratio (more precise for titles).
   */
  protected substringScore(a: string, b: string): number {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    return shorter.length / longer.length;
  }

  calculate(context: SimilarityContext): number {
    const normA = this.normalise(this.extractField(context, 'submission'));
    const normB = this.normalise(this.extractField(context, 'candidate'));

    if (normA === normB) return 1;

    if (normA.includes(normB) || normB.includes(normA)) {
      return this.substringScore(normA, normB);
    }

    return this.jaccard(normA, normB);
  }

  private normalise(value: string): string {
    return value
      .toLowerCase()
      .replace(this.noisePattern, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private jaccard(a: string, b: string): number {
    const wordsA = new Set(a.split(' '));
    const wordsB = new Set(b.split(' '));
    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }
}
