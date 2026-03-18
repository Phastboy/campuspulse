import { Injectable } from '@nestjs/common';
import { SimilarityContext } from '../similarity-rule.interface';
import { TextSimilarityRule } from './base/text-similarity.rule';

@Injectable()
export class TitleSimilarityRule extends TextSimilarityRule {
  readonly name = 'title';
  readonly weight = 0.5;
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
