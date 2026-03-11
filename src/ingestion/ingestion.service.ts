import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { SimilarityEngine } from './similarity-engine.service';
import { mapDtoToEventSubmission, SubmitEventDto } from './dto/submit-event.dto';
import { ConfirmSubmissionDto } from './dto/confirm-submission.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { Event } from '../events/entities/event.entity';
import { EVENT_STATUS } from '@common';


@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(Event)
    private readonly repo: EntityRepository<Event>,
    private readonly em: EntityManager,
    private readonly similarityEngine: SimilarityEngine,
  ) { }

  async submit(data: SubmitEventDto): Promise<SubmitResponseDto> {
    const similar = await this.similarityEngine.findSimilar(mapDtoToEventSubmission(data));

    if (similar.length === 0) {
      const event = await this.createEvent(data);
      return {
        action: 'created',
        message: 'Event submitted for review',
        eventId: event.id,
      };
    }

    return {
      action: 'needs_decision',
      message: 'Similar events found',
      similar,
      originalSubmission: data,
    };
  }

  async confirm(data: ConfirmSubmissionDto) {
    if (data.decision === 'duplicate') {
      return { action: 'linked', eventId: data.existingEventId };
    }

    return this.em.transactional(async (fork) => {
      const event = await this.createEvent(data, fork);
      return { action: 'created', eventId: event.id, message: '...' };
    });
  }

  private async createEvent(data: SubmitEventDto, em: EntityManager = this.em) {
    const event = this.repo.create({
      ...mapDtoToEventSubmission(data),
      status: EVENT_STATUS.PENDING,
      createdAt: new Date(),
    });

    await em.persist(event).flush();
    return event;
  }
}
