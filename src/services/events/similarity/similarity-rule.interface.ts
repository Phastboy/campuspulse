import { EventSubmission, EventSummary } from '@application/types';

export interface SimilarityContext {
  submission: EventSubmission;
  candidate: EventSummary;
  submissionDate: Date;
}

export interface SimilarityRule {
  readonly name: string;
  readonly weight: number;
  calculate(context: SimilarityContext): number;
  isApplicable?(context: SimilarityContext): boolean;
}
