import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { IStoreTourRepository } from '../../domain/ports/store-tour.repository.port.js';
import { MediaStorageService } from '../../../../storage/media-storage.service.js';

@Injectable()
export class DeleteStoreTourUseCase {
  constructor(
    private readonly storeTourRepo: IStoreTourRepository,
    private readonly storage: MediaStorageService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string): Promise<void> {
    const tour = await this.storeTourRepo.findById(id);
    if (!tour) {
      throw new NotFoundException('Store tour not found.');
    }

    // Fetch all media attached to this store tour for storage cleanup
    const mediaItems = await this.prisma.media.findMany({
      where: { storeTourId: id },
      select: { fileId: true },
    });

    await this.storeTourRepo.delete(id);

    // Clean up storage assets after DB is consistent (non-fatal)
    await Promise.allSettled(
      mediaItems.map((m) =>
        this.storage.deleteMedia(m.fileId).catch(() => {
          // TODO: log orphaned storage asset for async cleanup
        }),
      ),
    );
  }
}
