import { Injectable } from '@nestjs/common';
import { SimilarityContext } from '../interfaces/similarity-rule.interface';
import { TextSimilarityRule } from './base/text-similarity.rule';

/**
 * Scores how closely two event titles match.
 *
 * Weight: `0.5` — title is the strongest duplicate signal.
 * Inherits the normalise → exact → substring → Jaccard algorithm
 * from {@link TextSimilarityRule}.
 *
 * @example
 * "NACOS Parliamentary Summit 2026" vs "NACOS Parliamentary Summit 2026" → 1.0
 * "NACOS Summit" vs "NACOS Parliamentary Summit 2026" → ~0.5
 * "NACOS Tech Talk" vs "NACOS Summit" → ~0.33
 */
@Injectable()
export class TitleSimilarityRule extends TextSimilarityRule {
  readonly name: string = 'title';
  readonly weight: number = 0.5;

  protected noisePattern = /[^\w\s]/g;

  protected extractField(
    context: SimilarityContext,
    side: 'submission' | 'candidate',
  ): string {
    return side === 'submission'
      ? context.submission.title
      : context.candidate.title;
  }
}
