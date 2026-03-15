import { Injectable } from '@nestjs/common';
import { SimilarityContext } from '../interfaces/similarity-rule.interface';
import { TextSimilarityRule } from './base/text-similarity.rule';

/**
 * Scores how closely two event venues match.
 *
 * Weight: `0.3` — venue is a strong signal but weaker than title, since the
 * same venue can host multiple distinct events on the same day.
 *
 * Inherits the normalise → exact → substring → Jaccard algorithm from
 * {@link TextSimilarityRule}. Overrides `substringScore` to return a fixed
 * `0.9` — partial venue name matches (e.g. "ACE" in "ACE Conference Hall")
 * are very reliable and should score higher than a raw length ratio.
 *
 * @example
 * "Trust Hall" vs "Trust Hall" → 1.0
 * "ACE" vs "ACE Conference Hall, ICT" → 0.9
 * "SUB Car Park" vs "SUB Cafeteria" → ~0.33
 */
@Injectable()
export class VenueSimilarityRule extends TextSimilarityRule {
  readonly name: string = 'venue';
  readonly weight: number = 0.3;

  protected noisePattern = /[^\w\s]/g;

  protected extractField(
    context: SimilarityContext,
    side: 'submission' | 'candidate',
  ): string {
    return side === 'submission'
      ? context.submission.venue
      : context.candidate.venue;
  }

  protected substringScore(): number {
    // Partial venue name matches are highly reliable — score them uniformly high
    return 0.9;
  }
}
