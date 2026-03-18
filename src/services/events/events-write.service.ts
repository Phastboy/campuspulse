import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IEvent } from '@domain/interfaces';
import {
  EventChanges,
  EventSubmission,
  IngestionOutcome,
  CreatedOutcome,
  LinkedOutcome,
  NeedsDecisionOutcome,
  SimilarityMatch,
} from '@application/types';
import { InvalidDatetimeError } from '@domain/errors';
import { UpdateEventDto } from '@dto/update-event.dto';
import {
  type IEventReader,
  EVENT_READER,
} from '@ports/events/event-reader.port';
import {
  type IEventWriter,
  EVENT_WRITER,
} from '@ports/events/event-writer.port';
import {
  type ITransactionManager,
  TRANSACTION_MANAGER,
} from '@ports/transaction-manager.port';
import { EventDateTimeAssembler } from '@mappers/event-datetime.assembler';
import { EventDateTimeMapper } from '@mappers/event-datetime.mapper';
import {
  type ISimilarityEngine,
  SIMILARITY_ENGINE,
} from './similarity/similarity-engine.port';
import { SubmitEventDto } from '@dto/submit-event.dto';
import { ConfirmSubmissionDto } from '@dto/confirm-submission.dto';

@Injectable()
export class EventsWriteService {
  private readonly logger = new Logger(EventsWriteService.name);

  constructor(
    @Inject(EVENT_READER) private readonly eventReader: IEventReader,
    @Inject(EVENT_WRITER) private readonly eventWriter: IEventWriter,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: ITransactionManager,
    @Inject(SIMILARITY_ENGINE)
    private readonly similarityEngine: ISimilarityEngine,
    private readonly datetimeAssembler: EventDateTimeAssembler,
    private readonly datetimeMapper: EventDateTimeMapper,
  ) {}

  // ── Ingestion (write path with duplicate detection) ──────────────────────

  async submit(data: SubmitEventDto, createdBy: string | null = null): Promise<IngestionOutcome> {
    const submission = this.datetimeMapper.toEventSubmission(data);
    const similar = await this.similarityEngine.findSimilar(submission);
    const exactMatch = similar.find((s) => s.score === 1.0);

    if (exactMatch) return linked(exactMatch.event.id, 'Event already exists');
    if (similar.length === 0) {
      const eventId = await this.eventWriter.create(submission, createdBy);
      return created(eventId, 'Event published successfully');
    }
    return needsDecision(similar, submission);
  }

  async confirm(data: ConfirmSubmissionDto, createdBy: string | null = null): Promise<IngestionOutcome> {
    if (data.decision === 'duplicate' && data.existingEventId)
      return linked(data.existingEventId, 'Linked to existing event');

    const submission = this.datetimeMapper.toEventSubmission(data);
    const similar = await this.similarityEngine.findSimilar(submission);
    const exactMatch = similar.find((s) => s.score === 1.0);

    if (exactMatch) {
      this.logger.warn(
        `confirm("new") overridden — exact match: ${exactMatch.event.id}`,
      );
      return linked(exactMatch.event.id, 'Event already exists');
    }

    return this.transactionManager.run(async () => {
      const eventId = await this.eventWriter.create(submission, createdBy);
      return created(eventId, 'Event published successfully');
    });
  }

  // ── Direct mutations ─────────────────────────────────────────────────────

  async update(id: string, updateData: UpdateEventDto): Promise<IEvent> {
    const event = await this.eventReader.findById(id);
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

    try {
      const changes: EventChanges = {};
      if (updateData.title !== undefined) changes.title = updateData.title;
      if (updateData.venue !== undefined) changes.venue = updateData.venue;
      if (updateData.description !== undefined)
        changes.description = updateData.description;

      const hasDatetimeUpdate =
        updateData.type ||
        updateData.date ||
        updateData.startTime ||
        updateData.endTime ||
        updateData.endDate;

      if (hasDatetimeUpdate)
        changes.datetime = this.datetimeAssembler.applyUpdate(
          event.datetime,
          updateData,
        );

      await this.eventWriter.update(id, changes);
      return (await this.eventReader.findById(id)) as IEvent;
    } catch (error: unknown) {
      if (error instanceof InvalidDatetimeError)
        throw new BadRequestException(error.message);
      throw new BadRequestException(
        `Failed to update event: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async delete(id: string): Promise<void> {
    const event = await this.eventReader.findById(id);
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    await this.eventWriter.delete(id);
  }
}

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
