import { Injectable } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../interfaces/similarity-rule.interface';

@Injectable()
export class VenueSimilarityRule implements SimilarityRule {
  name = 'venue';
  weight = 0.3;

  calculate(context: SimilarityContext): number {
    const a = context.submission.venue;
    const b = context.candidate.venue;

    const normA = a
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const normB = b
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (normA === normB) return 1;
    if (normA.includes(normB) || normB.includes(normA)) return 0.9;

    const wordsA = new Set(normA.split(' '));
    const wordsB = new Set(normB.split(' '));

    const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
  }
}
