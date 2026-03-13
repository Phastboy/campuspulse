import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { SimilarityEngine } from './similarity-engine.service';
import { SubmitEventDto } from './dto/submit-event.dto';
import { ConfirmSubmissionDto } from './dto/confirm-submission.dto';
import { Event } from '../events/entities/event.entity';
import { EventSubmission } from '@events/domain';
import {
  CreatedResult,
  IngestionResult,
  LinkedResult,
  NeedsDecisionResult,
} from './dto/ingestion-result.dto';

/**
 * Orchestrates the two-step event ingestion pipeline.
 *
 * **Step 1 — Submit** (`submit`):
 * The submission is normalised and scored against existing events.
 * - Exact match found → auto-link, return `linked`
 * - No similar events → auto-publish, return `created`
 * - Similar but not exact → return `needs_decision` with candidate list
 *
 * **Step 2 — Confirm** (`confirm`):
 * Called only when step 1 returned `needs_decision`. The submitter provides
 * their resolution (`"duplicate"` or `"new"`).
 * - `"duplicate"` → link to the specified existing event, return `linked`
 * - `"new"` → re-check for exact match first (trust model); if none found,
 *   create a new event, return `created`
 *
 * **Trust model:**
 * Even when a submitter selects `"new"`, the engine re-runs the exact match
 * check. If an exact match exists, the submission is linked regardless of
 * the submitter's decision. This prevents intentional duplicate creation.
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @InjectRepository(Event)
    private readonly repo: EntityRepository<Event>,
    private readonly em: EntityManager,
    private readonly similarityEngine: SimilarityEngine,
  ) {}

  /**
   * Runs the first step of the ingestion pipeline.
   *
   * Scores the submission against existing events and returns one of three
   * outcomes depending on what the similarity engine finds.
   *
   * @param data - The submitted event payload
   * @returns `CreatedResult` | `LinkedResult` | `NeedsDecisionResult`
   */
  async submit(data: SubmitEventDto): Promise<IngestionResult> {
    const submission = data.toEventSubmission();
    const similar = await this.similarityEngine.findSimilar(submission);

    const exactMatch = similar.find((s) => s.score === 1.0);

    if (exactMatch) {
      this.logger.log(
        `Exact match for "${data.title}" → auto-linking to ${exactMatch.event.id}`,
      );
      return this.buildLinked(exactMatch.event.id, 'Event already exists');
    }

    if (similar.length === 0) {
      const event = await this.createEvent(submission);
      return this.buildCreated(event.id, 'Event published successfully');
    }

    return this.buildNeedsDecision(
      'Similar events found. Is this the same event?',
      similar,
      data,
    );
  }

  /**
   * Runs the second step of the ingestion pipeline, resolving a
   * `needs_decision` outcome from `submit`.
   *
   * When `decision` is `"new"`, the engine re-checks for an exact match
   * before creating — the submitter's decision is advisory, not authoritative.
   *
   * @param data - The confirm payload including the submitter's decision
   * @returns `CreatedResult` | `LinkedResult`
   */
  async confirm(data: ConfirmSubmissionDto): Promise<IngestionResult> {
    if (data.decision === 'duplicate' && data.existingEventId) {
      this.logger.log(
        `Submitter confirmed duplicate → linking to ${data.existingEventId}`,
      );
      return this.buildLinked(data.existingEventId, 'Linked to existing event');
    }

    // Trust model: re-verify there is no exact match even if submitter says "new"
    const submission = data.toEventSubmission();
    const similar = await this.similarityEngine.findSimilar(submission);
    const exactMatch = similar.find((s) => s.score === 1.0);

    if (exactMatch) {
      this.logger.warn(
        `confirm("new") overridden — exact match exists: ${exactMatch.event.id}`,
      );
      return this.buildLinked(exactMatch.event.id, 'Event already exists');
    }

    return this.em.transactional(async (fork) => {
      const event = await this.createEvent(submission, fork);
      return this.buildCreated(event.id, 'Event published successfully');
    });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Persists a new `Event` entity derived from the given submission.
   *
   * Accepts an optional `EntityManager` fork so it can participate in an
   * existing transaction (e.g. from `em.transactional`). Falls back to
   * `this.em` when no fork is provided.
   *
   * @param data - Normalised event submission
   * @param em - Optional entity manager fork for transactional writes
   * @returns The newly created and flushed `Event`
   */
  private async createEvent(
    data: EventSubmission,
    em: EntityManager = this.em,
  ): Promise<Event> {
    const event = this.repo.create({
      ...data,
      createdAt: new Date(),
    });
    await em.persist(event).flush();
    return event;
  }

  /**
   * Builds a {@link CreatedResult} object literal.
   *
   * @param eventId - UUID of the newly created event
   * @param message - Human-readable outcome description
   */
  private buildCreated(eventId: string, message: string): CreatedResult {
    return { action: 'created', eventId, message };
  }

  /**
   * Builds a {@link LinkedResult} object literal.
   *
   * @param eventId - UUID of the existing event this submission was linked to
   * @param message - Human-readable outcome description
   */
  private buildLinked(eventId: string, message: string): LinkedResult {
    return { action: 'linked', eventId, message };
  }

  /**
   * Builds a {@link NeedsDecisionResult} object literal.
   *
   * @param message - Explanation of why confirmation is required
   * @param similar - Candidate events from the similarity engine
   * @param originalSubmission - Echo of the original DTO for the confirm step
   */
  private buildNeedsDecision(
    message: string,
    similar: NeedsDecisionResult['similar'],
    originalSubmission: SubmitEventDto,
  ): NeedsDecisionResult {
    return { action: 'needs_decision', message, similar, originalSubmission };
  }
}
