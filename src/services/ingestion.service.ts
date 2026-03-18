import { Inject, Injectable, Logger } from '@nestjs/common';
import { SubmitEventDto } from '@dto/submit-event.dto';
import { ConfirmSubmissionDto } from '@dto/confirm-submission.dto';
import {
  IngestionOutcome,
  CreatedOutcome,
  LinkedOutcome,
  NeedsDecisionOutcome,
  SimilarityMatch,
  EventSubmission,
} from '@application/types';
import {
  type ISimilarityEngine,
  SIMILARITY_ENGINE,
} from '@ports/similarity-engine.port';
import { type IEventCreator, EVENT_CREATOR } from '@ports/event-creator.port';
import {
  type ITransactionManager,
  TRANSACTION_MANAGER,
} from '@ports/transaction-manager.port';
import { EventDateTimeMapper } from '@mappers/event-datetime.mapper';

/**
 * Orchestrates the two-step event ingestion pipeline.
 *
 * Returns {@link IngestionOutcome} — a domain-level discriminated union with
 * no Swagger decorators. The controller maps outcomes to HTTP DTOs at the
 * boundary. Zero ORM imports. Zero infrastructure imports.
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @Inject(SIMILARITY_ENGINE)
    private readonly similarityEngine: ISimilarityEngine,
    @Inject(EVENT_CREATOR) private readonly eventCreator: IEventCreator,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: ITransactionManager,
    private readonly mapper: EventDateTimeMapper,
  ) {}

  async submit(data: SubmitEventDto): Promise<IngestionOutcome> {
    const submission = this.mapper.toEventSubmission(data);
    const similar = await this.similarityEngine.findSimilar(submission);
    const exactMatch = similar.find((s) => s.score === 1.0);

    if (exactMatch) {
      return linked(exactMatch.event.id, 'Event already exists');
    }
    if (similar.length === 0) {
      const event = await this.eventCreator.create(submission);
      return created(event.id, 'Event published successfully');
    }
    return needsDecision(similar, submission);
  }

  async confirm(data: ConfirmSubmissionDto): Promise<IngestionOutcome> {
    if (data.decision === 'duplicate' && data.existingEventId) {
      return linked(data.existingEventId, 'Linked to existing event');
    }

    const submission = this.mapper.toEventSubmission(data);
    const similar = await this.similarityEngine.findSimilar(submission);
    const exactMatch = similar.find((s) => s.score === 1.0);

    if (exactMatch) {
      this.logger.warn(
        `confirm("new") overridden — exact match: ${exactMatch.event.id}`,
      );
      return linked(exactMatch.event.id, 'Event already exists');
    }

    return this.transactionManager.run(async () => {
      const event = await this.eventCreator.create(submission);
      return created(event.id, 'Event published successfully');
    });
  }
}

// ── Outcome factories ────────────────────────────────────────────────────────

function created(eventId: string, message: string): CreatedOutcome {
  return { action: 'created', eventId, message };
}

function linked(eventId: string, message: string): LinkedOutcome {
  return { action: 'linked', eventId, message };
}

function needsDecision(
  similar: SimilarityMatch[],
  originalSubmission: EventSubmission,
): NeedsDecisionOutcome {
  return {
    action: 'needs_decision',
    message: 'Similar events found. Is this the same event?',
    similar,
    originalSubmission,
  };
}
