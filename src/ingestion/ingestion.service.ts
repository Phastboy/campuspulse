import { Inject, Injectable, Logger } from '@nestjs/common';
import { SubmitEventDto } from './dto/submit-event.dto';
import { ConfirmSubmissionDto } from './dto/confirm-submission.dto';
import {
  CreatedResult,
  IngestionResult,
  LinkedResult,
  NeedsDecisionResult,
} from './dto/ingestion-result.dto';
import {
  type ISimilarityEngine,
  SIMILARITY_ENGINE,
} from './ports/similarity-engine.port';
import {
  type IEventWriter,
  EVENT_WRITER,
} from '@events/ports/event-writer.port';
import {
  type ITransactionManager,
  TRANSACTION_MANAGER,
} from '../common/ports/transaction-manager.port';
import { EventDateTimeMapper } from './mappers/event-datetime.mapper';

/**
 * Orchestrates the two-step event ingestion pipeline.
 *
 * Zero ORM imports. All infrastructure concerns are behind port interfaces.
 * {@link EventDateTimeMapper} is now in `ingestion/mappers/` — no cross-module
 * mapper import needed.
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @Inject(SIMILARITY_ENGINE)
    private readonly similarityEngine: ISimilarityEngine,
    @Inject(EVENT_WRITER)
    private readonly eventWriter: IEventWriter,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: ITransactionManager,
    private readonly mapper: EventDateTimeMapper,
  ) {}

  async submit(data: SubmitEventDto): Promise<IngestionResult> {
    const submission = this.mapper.toEventSubmission(data);
    const similar = await this.similarityEngine.findSimilar(submission);
    const exactMatch = similar.find((s) => s.score === 1.0);

    if (exactMatch) {
      this.logger.log(
        `Exact match for "${data.title}" → auto-linking to ${exactMatch.event.id}`,
      );
      return this.buildLinked(exactMatch.event.id, 'Event already exists');
    }

    if (similar.length === 0) {
      const event = await this.eventWriter.create(submission);
      return this.buildCreated(event.id, 'Event published successfully');
    }

    return this.buildNeedsDecision(
      'Similar events found. Is this the same event?',
      similar,
      data,
    );
  }

  async confirm(data: ConfirmSubmissionDto): Promise<IngestionResult> {
    if (data.decision === 'duplicate' && data.existingEventId) {
      this.logger.log(
        `Submitter confirmed duplicate → linking to ${data.existingEventId}`,
      );
      return this.buildLinked(data.existingEventId, 'Linked to existing event');
    }

    const submission = this.mapper.toEventSubmission(data);
    const similar = await this.similarityEngine.findSimilar(submission);
    const exactMatch = similar.find((s) => s.score === 1.0);

    if (exactMatch) {
      this.logger.warn(
        `confirm("new") overridden — exact match exists: ${exactMatch.event.id}`,
      );
      return this.buildLinked(exactMatch.event.id, 'Event already exists');
    }

    return this.transactionManager.run(async () => {
      const event = await this.eventWriter.create(submission);
      return this.buildCreated(event.id, 'Event published successfully');
    });
  }

  private buildCreated(eventId: string, message: string): CreatedResult {
    return { action: 'created', eventId, message };
  }

  private buildLinked(eventId: string, message: string): LinkedResult {
    return { action: 'linked', eventId, message };
  }

  private buildNeedsDecision(
    message: string,
    similar: NeedsDecisionResult['similar'],
    originalSubmission: SubmitEventDto,
  ): NeedsDecisionResult {
    return { action: 'needs_decision', message, similar, originalSubmission };
  }
}
