import { EventSubmission } from '@events/domain';
import { Event } from '../../events/entities/event.entity';

export interface SimilarityContext {
  submission: EventSubmission;
  candidate: Event;
  submissionDate: Date;
}

export interface SimilarityRule {
  readonly name: string;
  readonly weight: number;
  calculate(context: SimilarityContext): number;
  isApplicable?(context: SimilarityContext): boolean;
}
