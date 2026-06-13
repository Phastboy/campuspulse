import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IMediaRepository, MediaOwnerKey } from '../../domain/ports/media.repository.port.js';
import { MediaRole } from '../../domain/types/media-role.enum.js';
import { Media } from '../../domain/types/media.entity.js';

@Injectable()
export class ReorderMediaUseCase {
  constructor(private readonly mediaRepo: IMediaRepository) {}

  async execute(ownerKey: MediaOwnerKey, ownerId: string, orderedIds: string[]): Promise<Media[]> {
    // Only GALLERY items are reorderable — singleton roles have no position
    const existing = await this.mediaRepo.findByRole(ownerKey, ownerId, MediaRole.GALLERY);

    if (existing.length === 0) {
      throw new NotFoundException('No gallery items found for this resource.');
    }

    // Validate — orderedIds must be an exact match of existing GALLERY IDs, no extras, no missing
    const existingIds = new Set(existing.map((m) => m.id));
    const incomingIds = new Set(orderedIds);

    if (orderedIds.length !== existing.length) {
      throw new BadRequestException(
        'orderedIds must contain all existing gallery media IDs — no additions or omissions.',
      );
    }

    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(
          `Media ID ${id} does not belong to the gallery of this resource.`,
        );
      }
    }

    for (const m of existing) {
      if (!incomingIds.has(m.id)) {
        throw new BadRequestException(`Gallery media ID ${m.id} is missing from orderedIds.`);
      }
    }

    return this.mediaRepo.reorder(ownerKey, ownerId, { orderedIds });
  }
}
