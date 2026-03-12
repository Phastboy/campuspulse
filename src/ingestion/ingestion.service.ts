import { Injectable } from '@nestjs/common';
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
  constructor(
    @InjectRepository(Event)
    private readonly repo: EntityRepository<Event>,
    private readonly em: EntityManager,
    private readonly similarityEngine: SimilarityEngine,
  ) { }

  async submit(data: SubmitEventDto): Promise<SubmitResponseDto> {
    const similar = await this.similarityEngine.findSimilar(
      data.toEventSubmission()
    );

    if (similar.length === 0) {
      const event = await this.createEvent(data.toEventSubmission());
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
        message: 'Linked to existing event'
      };
    }

    return this.em.transactional(async (fork) => {
      const event = await this.createEvent(data.toEventSubmission(), fork);
      return {
        action: 'created',
        eventId: event.id,
        message: 'Event published successfully'
      };
    });
  }

  private async createEvent(data: EventSubmission, em: EntityManager = this.em) {
    const event = this.repo.create({
      ...data,
      createdAt: new Date(),
    });

    await em.persist(event).flush();
    return event;
  }
}
