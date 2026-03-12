import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { SimilarityEngine } from './similarity-engine.service';
import { SubmitEventDto } from './dto/submit-event.dto';
import { ConfirmSubmissionDto } from './dto/confirm-submission.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { Event } from '../events/entities/event.entity';
import { EventSubmission } from '@events/domain';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @InjectRepository(Event)
    private readonly repo: EntityRepository<Event>,
    private readonly em: EntityManager,
    private readonly similarityEngine: SimilarityEngine,
  ) {}

  async submit(data: SubmitEventDto): Promise<SubmitResponseDto> {
    const submission = data.toEventSubmission();
    const similar = await this.similarityEngine.findSimilar(submission);

    // Check for exact match (score 1.0)
    const exactMatch = similar.find((s) => s.score === 1.0);

    if (exactMatch) {
      this.logger.log(
        `🎯 Exact match found for "${data.title}" - auto-linking to ${exactMatch.event.id}`,
      );

      return {
        action: 'linked',
        message: 'Event already exists',
        eventId: exactMatch.event.id,
      };
    }

    if (similar.length === 0) {
      const event = await this.createEvent(submission);
      return {
        action: 'created',
        message: 'Event published successfully',
        eventId: event.id,
      };
    }

    return {
      action: 'needs_decision',
      message: 'Similar events found. Is this the same event?',
      similar,
      originalSubmission: data,
    };
  }

  async confirm(data: ConfirmSubmissionDto) {
    if (data.decision === 'duplicate') {
      return {
        action: 'linked',
        eventId: data.existingEventId,
        message: 'Linked to existing event',
      };
    }

    // Guard: don't create if an exact match exists, regardless of user's decision
    const submission = data.toEventSubmission();
    const similar = await this.similarityEngine.findSimilar(submission);
    const exactMatch = similar.find((s) => s.score === 1.0);

    if (exactMatch) {
      this.logger.warn(
        `confirm("new") rejected - exact match exists: ${exactMatch.event.id}`,
      );
      return {
        action: 'linked',
        eventId: exactMatch.event.id,
        message: 'Exact duplicate detected; linked to existing event',
      };
    }

    return this.em.transactional(async (fork) => {
      const event = await this.createEvent(submission, fork);
      return {
        action: 'created',
        eventId: event.id,
        message: 'Event published successfully',
      };
    });
  }

  private async createEvent(
    data: EventSubmission,
    em: EntityManager = this.em,
  ) {
    const event = this.repo.create({
      ...data,
      createdAt: new Date(),
    });

    await em.persist(event).flush();
    return event;
  }
}
