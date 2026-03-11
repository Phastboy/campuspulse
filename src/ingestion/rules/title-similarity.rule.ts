import { Injectable } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../interfaces/similarity-rule.interface';

@Injectable()
export class TitleSimilarityRule implements SimilarityRule {
  name = 'title';
  weight = 0.5;

  calculate(context: SimilarityContext): number {
    const a = context.submission.title;
    const b = context.candidate.title;

    // Normalize
    const normA = a
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const normB = b
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (normA === normB) return 1;
    if (normA.includes(normB) || normB.includes(normA)) {
      const longer = normA.length > normB.length ? normA : normB;
      const shorter = normA.length > normB.length ? normB : normA;
      return shorter.length / longer.length;
    }

    // Word overlap
    const wordsA = new Set(normA.split(' '));
    const wordsB = new Set(normB.split(' '));

    const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
  }
}
