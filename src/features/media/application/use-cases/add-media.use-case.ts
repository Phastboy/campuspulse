import { Injectable, BadRequestException } from '@nestjs/common';
import { Readable } from 'stream';
import { MediaStorageService } from '../../../../storage/media-storage.service.js';
import { IMediaRepository, MediaOwnerKey } from '../../domain/ports/media.repository.port.js';
import {
  MediaRole,
  SINGLETON_ROLES,
  ROLES_BY_FK_NAME,
} from '../../domain/types/media-role.enum.js';
import { MediaType } from '../../domain/types/media-type.enum.js';
import { Media } from '../../domain/types/media.entity.js';

export interface AddMediaInput {
  readonly ownerKey: MediaOwnerKey;
  readonly ownerId: string;
  readonly requesterId: string;
  readonly fileName: string;
  readonly fileStream: Readable;
  readonly mediaType: MediaType;
  readonly role: MediaRole;
}

/** Max gallery items per resource — business resources allow more (curated). */
const MAX_GALLERY_ITEMS: Record<MediaOwnerKey, number> = {
  listingId: 18,
  businessProfileId: 18,
  storeTourId: 18,
  // Reviews are raw & concise — 8 photos max.
  reviewId: 8,
};

const STORAGE_DESTINATION: Record<MediaOwnerKey, string> = {
  listingId: 'listings/media',
  businessProfileId: 'businesses/media',
  storeTourId: 'store-tours/media',
  reviewId: 'reviews/media',
};

@Injectable()
export class AddMediaUseCase {
  constructor(
    private readonly mediaRepo: IMediaRepository,
    private readonly storage: MediaStorageService,
  ) {}

  async execute(input: AddMediaInput): Promise<Media> {
    // 1. Validate role is legal for this resource owner
    const allowedRoles = ROLES_BY_FK_NAME[input.ownerKey];
    if (!allowedRoles?.has(input.role)) {
      throw new BadRequestException(
        `Role "${input.role}" is not valid for resource "${input.ownerKey}".`,
      );
    }

    const isSingleton = SINGLETON_ROLES.has(input.role);

    // 2a. For singleton roles: find the existing one to replace (if any)
    //     We capture it before uploading so we can clean up after.
    let replacedFileId: string | null = null;
    let replacedId: string | null = null;

    if (isSingleton) {
      const existing = await this.mediaRepo.findByRole(input.ownerKey, input.ownerId, input.role);
      if (existing.length > 0 && existing[0]) {
        replacedId = existing[0].id;
        replacedFileId = existing[0].fileId;
      }
    } else {
      // 2b. For GALLERY: enforce per-resource cap
      const galleryCount = await this.mediaRepo.countByRole(
        input.ownerKey,
        input.ownerId,
        MediaRole.GALLERY,
      );
      const cap = MAX_GALLERY_ITEMS[input.ownerKey];
      if (galleryCount >= cap) {
        throw new BadRequestException(`Maximum of ${cap} gallery items allowed per resource.`);
      }
    }

    // 3. Upload new file to storage first
    //    If this fails nothing has been mutated — safe to propagate the error.
    const result = await this.storage.uploadNewMedia({
      destination: STORAGE_DESTINATION[input.ownerKey],
      fileName: input.fileName,
      fileData: input.fileStream,
    });

    // 4. If replacing a singleton: remove the old DB record before inserting the new one.
    //    This keeps the singleton invariant intact at the persistence layer.
    if (replacedId) {
      await this.mediaRepo.delete(replacedId);
    }

    // 5. Persist the new media record.
    //    Singletons carry no position (order = null); GALLERY appended at end.
    const order = isSingleton
      ? null
      : await this.mediaRepo.countByRole(input.ownerKey, input.ownerId, MediaRole.GALLERY);

    const created = await this.mediaRepo.add({
      [input.ownerKey]: input.ownerId,
      url: result.url,
      fileId: result.fileId,
      mediaType: input.mediaType,
      role: input.role,
      order,
    }); // Cast as any because the rest of the inputs are specific to the media creation

    // 6. Delete the old storage asset after DB is consistent.
    //    Non-fatal — a dangling storage file is preferable to rolling back a successful replace.
    if (replacedFileId) {
      await this.storage.deleteMedia(replacedFileId).catch(() => {
        // TODO: log orphaned storage asset for async cleanup
      });
    }

    return created;
  }
}
