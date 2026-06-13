import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaStorageService } from '../../../../storage/media-storage.service.js';
import { IMediaRepository, MediaOwnerKey } from '../../domain/ports/media.repository.port.js';
import { MediaRole } from '../../domain/types/media-role.enum.js';
import { Media } from '../../domain/types/media.entity.js';

@Injectable()
export class DeleteMediaUseCase {
  constructor(
    private readonly mediaRepo: IMediaRepository,
    private readonly storage: MediaStorageService,
  ) {}

  async execute(id: string): Promise<void> {
    const media = await this.mediaRepo.findById(id);

    if (!media) {
      throw new NotFoundException('Media item not found.');
    }

    // Delete from DB first — if storage cleanup fails it's logged, not fatal
    await this.mediaRepo.delete(id);

    // Only renormalize order for GALLERY items — singletons have no position to renormalize
    if (media.role === MediaRole.GALLERY) {
      const owner = this.#getOwner(media);
      if (owner) {
        await this.mediaRepo.renormalize(owner.key, owner.id);
      }
    }

    // Clean up storage asset after DB is consistent
    await this.storage.deleteMedia(media.fileId);
  }

  #getOwner(media: Media): { key: MediaOwnerKey; id: string } | null {
    if (media.businessProfileId) return { key: 'businessProfileId', id: media.businessProfileId };
    if (media.listingId) return { key: 'listingId', id: media.listingId };
    if (media.storeTourId) return { key: 'storeTourId', id: media.storeTourId };
    if (media.reviewId) return { key: 'reviewId', id: media.reviewId };
    return null;
  }
}
