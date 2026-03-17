import { Inject, Injectable, Logger } from '@nestjs/common';
import { SubmitEventDto } from '@dto/submit-event.dto';
import { ConfirmSubmissionDto } from '@dto/confirm-submission.dto';
import {
  IngestionResult,
  CreatedResult,
  LinkedResult,
  NeedsDecisionResult,
} from '@dto/ingestion-result.dto';
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
 * Zero ORM imports. Zero infrastructure imports. All persistence flows through
 * injected port interfaces.
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

  async submit(data: SubmitEventDto): Promise<IngestionResult> {
    const submission = this.mapper.toEventSubmission(data);
    const similar = await this.similarityEngine.findSimilar(submission);
    const exactMatch = similar.find((s) => s.score === 1.0);

    if (exactMatch) {
      return IngestionResultFactory.linked(
        exactMatch.event.id,
        'Event already exists',
      );
    }
    if (similar.length === 0) {
      const event = await this.eventCreator.create(submission);
      return IngestionResultFactory.created(
        event.id,
        'Event published successfully',
      );
    }
    return IngestionResultFactory.needsDecision(similar, data);
  }

  async confirm(data: ConfirmSubmissionDto): Promise<IngestionResult> {
    if (data.decision === 'duplicate' && data.existingEventId) {
      return IngestionResultFactory.linked(
        data.existingEventId,
        'Linked to existing event',
      );
    }

    const submission = this.mapper.toEventSubmission(data);
    const similar = await this.similarityEngine.findSimilar(submission);
    const exactMatch = similar.find((s) => s.score === 1.0);

    if (exactMatch) {
      this.logger.warn(
        `confirm("new") overridden — exact match: ${exactMatch.event.id}`,
      );
      return IngestionResultFactory.linked(
        exactMatch.event.id,
        'Event already exists',
      );
    }

    return this.transactionManager.run(async () => {
      const event = await this.eventCreator.create(submission);
      return IngestionResultFactory.created(
        event.id,
        'Event published successfully',
      );
    });
  }
}

class IngestionResultFactory {
  static created(eventId: string, message: string): CreatedResult {
    return Object.assign(new CreatedResult(), {
      action: 'created' as const,
      eventId,
      message,
    });
  }
  static linked(eventId: string, message: string): LinkedResult {
    return Object.assign(new LinkedResult(), {
      action: 'linked' as const,
      eventId,
      message,
    });
  }
  static needsDecision(
    similar: NeedsDecisionResult['similar'],
    originalSubmission: SubmitEventDto,
  ): NeedsDecisionResult {
    return Object.assign(new NeedsDecisionResult(), {
      action: 'needs_decision' as const,
      message: 'Similar events found. Is this the same event?',
      similar,
      originalSubmission,
    });
  }
}
