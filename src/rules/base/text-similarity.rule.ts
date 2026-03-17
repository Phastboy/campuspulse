import {
  SimilarityRule,
  SimilarityContext,
} from '@similarity/similarity-rule.interface';

/**
 * Abstract base for string-field similarity rules.
 *
 * Template Method pattern: defines the full scoring algorithm once.
 * Subclasses implement only `extractField` and `noisePattern`.
 *
 * Algorithm (first match wins):
 * 1. Exact match after normalisation → 1.0
 * 2. Substring containment → ratio of shorter/longer length (or override)
 * 3. Jaccard word overlap → |A ∩ B| / |A ∪ B|
 */
export abstract class TextSimilarityRule implements SimilarityRule {
  abstract readonly name: string;
  abstract readonly weight: number;

  protected abstract extractField(
    context: SimilarityContext,
    side: 'submission' | 'candidate',
  ): string;
  protected abstract noisePattern: RegExp;

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
