import { Injectable } from '@nestjs/common';
import { SimilarityContext } from '../similarity-rule.interface';
import { TextSimilarityRule } from './base/text-similarity.rule';

@Injectable()
export class VenueSimilarityRule extends TextSimilarityRule {
  readonly name = 'venue';
  readonly weight = 0.3;
  protected noisePattern = /[^\w\s]/g;

  protected extractField(context: SimilarityContext, side: 'submission' | 'candidate'): string {
    return side === 'submission' ? context.submission.venue : context.candidate.venue;
  }

  protected substringScore(): number { return 0.9; }
}
