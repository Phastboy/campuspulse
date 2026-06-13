import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IReviewRepository } from '../../domain/ports/review.repository.port.js';
import { MediaStorageService } from '../../../../storage/media-storage.service.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';

@Injectable()
export class DeleteReviewUseCase {
  constructor(
    private readonly reviewRepo: IReviewRepository,
    private readonly storage: MediaStorageService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * @param requesterId - resolved user ID of the caller
   * @param isAdmin     - true if the caller holds ADMIN platform role
   */
  async execute(id: string, requesterId: string, isAdmin: boolean): Promise<void> {
    const review = await this.reviewRepo.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    if (review.reviewerId !== requesterId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own reviews.');
    }

    // Fetch all media attached to this review for storage cleanup
    const mediaItems = await this.prisma.media.findMany({
      where: { reviewId: id },
      select: { fileId: true },
    });

    // Delete the review — cascade in DB will remove media rows
    await this.reviewRepo.delete(id);

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
