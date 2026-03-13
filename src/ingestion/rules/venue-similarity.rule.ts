import { Injectable } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../interfaces/similarity-rule.interface';

/**
 * Similarity rule that scores how closely two event venues match.
 *
 * Weight: `0.3` — venue is a strong duplicate signal but weaker than title,
 * since the same venue can host multiple distinct events on the same day.
 *
 * Scoring strategy (evaluated in order, first match wins):
 * 1. **Exact** — normalised strings are identical → `1.0`
 * 2. **Substring** — one venue name contains the other → `0.9`
 *    (e.g. "ACE" matching "ACE Conference Hall, ICT")
 * 3. **Word overlap** — Jaccard similarity over word sets → `|A ∩ B| / |A ∪ B|`
 *
 * Normalisation applied before all comparisons:
 * - Lowercased
 * - Non-word characters (punctuation, commas) removed
 * - Collapsed whitespace
 * - Trimmed
 *
 * @example
 * // "Trust Hall" vs "Trust Hall" → 1.0
 * // "ACE" vs "ACE Conference Hall, ICT" → 0.9 (substring)
 * // "SUB Car Park" vs "SUB Cafeteria" → ~0.33 (word overlap)
 */
@Injectable()
export class VenueSimilarityRule implements SimilarityRule {
  readonly name: string = 'venue';
  readonly weight: number = 0.3;

  /**
   * Computes a venue similarity score for the given submission/candidate pair.
   *
   * @param context - Scoring context containing the submission and candidate
   * @returns Score in `[0, 1]` — higher means more similar venues
   */
  calculate(context: SimilarityContext): number {
    const normA = this.normalise(context.submission.venue);
    const normB = this.normalise(context.candidate.venue);

    if (normA === normB) return 1;
    if (normA.includes(normB) || normB.includes(normA)) return 0.9;

    const wordsA = new Set(normA.split(' '));
    const wordsB = new Set(normB.split(' '));
    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
  }

  /**
   * Normalises a venue string for comparison.
   * Lowercases, strips punctuation, collapses whitespace, and trims.
   *
   * @param value - Raw venue string
   * @returns Normalised string
   */
  private normalise(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
