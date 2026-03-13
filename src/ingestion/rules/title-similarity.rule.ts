import { Injectable } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../interfaces/similarity-rule.interface';

/**
 * Similarity rule that scores how closely two event titles match.
 *
 * Weight: `0.5` — title is the strongest single signal for duplicate detection.
 *
 * Scoring strategy (evaluated in order, first match wins):
 * 1. **Exact** — normalised strings are identical → `1.0`
 * 2. **Substring** — one title contains the other → score proportional to
 *    length ratio (longer / shorter), rewarding specificity
 * 3. **Word overlap** — Jaccard similarity over word sets → `|A ∩ B| / |A ∪ B|`
 *
 * Normalisation applied before all comparisons:
 * - Lowercased
 * - Non-word characters (punctuation, special characters) replaced with spaces
 * - Collapsed whitespace
 * - Trimmed
 *
 * @example
 * // "NACOS Parliamentary Summit 2026" vs "NACOS Parliamentary Summit 2026" → 1.0
 * // "NACOS Summit" vs "NACOS Parliamentary Summit 2026" → ~0.5 (substring ratio)
 * // "NACOS Tech Talk" vs "NACOS Summit" → ~0.33 (word overlap)
 */
@Injectable()
export class TitleSimilarityRule implements SimilarityRule {
  readonly name: string = 'title';
  readonly weight: number = 0.5;

  /**
   * Computes a title similarity score for the given submission/candidate pair.
   *
   * @param context - Scoring context containing the submission and candidate
   * @returns Score in `[0, 1]` — higher means more similar titles
   */
  calculate(context: SimilarityContext): number {
    const normA = this.normalise(context.submission.title);
    const normB = this.normalise(context.candidate.title);

    if (normA === normB) return 1;

    if (normA.includes(normB) || normB.includes(normA)) {
      const longer = normA.length > normB.length ? normA : normB;
      const shorter = normA.length > normB.length ? normB : normA;
      return shorter.length / longer.length;
    }

    const wordsA = new Set(normA.split(' '));
    const wordsB = new Set(normB.split(' '));
    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
  }

  /**
   * Normalises a title string for comparison.
   * Lowercases, strips punctuation, collapses whitespace, and trims.
   *
   * @param value - Raw title string
   * @returns Normalised string
   */
  private normalise(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
