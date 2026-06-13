import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IStoreTourRepository } from '../../domain/ports/store-tour.repository.port.js';
import { StoreTour, StoreTourStatus } from '../../domain/types/store-tour.entity.js';
import { UpdateStoreTourInput } from '../../domain/types/store-tour.types.js';
import { MailQueueService } from '../../../../mail/mail-queue.service.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';

@Injectable()
export class UpdateStoreTourUseCase {
  constructor(
    private readonly storeTourRepo: IStoreTourRepository,
    private readonly prisma: PrismaService,
    private readonly mailQueueService: MailQueueService,
  ) {}

  async execute(id: string, input: UpdateStoreTourInput): Promise<StoreTour> {
    const existing = await this.storeTourRepo.findById(id);
    if (!existing) {
      throw new NotFoundException('Store tour not found.');
    }

    if (input.status === StoreTourStatus.PUBLISHED) {
      if (!existing.media || existing.media.length === 0) {
        throw new BadRequestException(
          'Cannot publish a store tour without at least one media item.',
        );
      }
    }

    const updatedTour = await this.storeTourRepo.update(id, input);

    if (input.status === StoreTourStatus.PUBLISHED && existing.status !== StoreTourStatus.PUBLISHED) {
      const business = await this.prisma.businessProfile.findUnique({
        where: { id: existing.businessProfileId },
        select: { email: true, name: true },
      });

      if (business) {
        await this.mailQueueService.enqueueMail({
          to: business.email,
          subject: 'Your Store Tour is Live on Pulse!',
          template: 'store-tour-published',
          context: {
            businessName: business.name,
            action_url: `https://pulse.app/store-tours/${updatedTour.id}`,
          },
        });
      }
    }

    return updatedTour;
  }
}
