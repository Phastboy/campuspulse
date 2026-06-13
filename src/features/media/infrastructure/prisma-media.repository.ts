import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IMediaRepository, MediaOwnerKey } from '../domain/ports/media.repository.port.js';
import { Media } from '../domain/types/media.entity.js';
import { MediaRole } from '../domain/types/media-role.enum.js';
import { AddMediaInput, ReorderMediaInput } from '../domain/types/media.types.js';
import { Media as PrismaMedia } from '../../../../generated/prisma/client.js';

function toDomain(raw: PrismaMedia): Media {
  return {
    id: raw.id,
    businessProfileId: raw.businessProfileId,
    listingId: raw.listingId,
    storeTourId: raw.storeTourId,
    reviewId: raw.reviewId,
    url: raw.url,
    fileId: raw.fileId,
    mediaType: raw.mediaType,
    role: raw.role,
    order: raw.order,
    createdAt: raw.createdAt,
  };
}

@Injectable()
export class PrismaMediaRepository extends IMediaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async add(input: AddMediaInput): Promise<Media> {
    const raw = await this.prisma.media.create({
      data: {
        ...input,
      },
    });
    return toDomain(raw);
  }

  async findByOwner(ownerKey: MediaOwnerKey, ownerId: string): Promise<Media[]> {
    const rows = await this.prisma.media.findMany({
      where: { [ownerKey]: ownerId },
      orderBy: [{ role: 'asc' }, { order: 'asc' }],
    });
    return rows.map(toDomain);
  }

  async findByRole(ownerKey: MediaOwnerKey, ownerId: string, role: MediaRole): Promise<Media[]> {
    const rows = await this.prisma.media.findMany({
      where: { [ownerKey]: ownerId, role },
      orderBy: { order: 'asc' },
    });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Media | null> {
    const raw = await this.prisma.media.findUnique({ where: { id } });
    return raw ? toDomain(raw) : null;
  }

  async reorder(
    ownerKey: MediaOwnerKey,
    ownerId: string,
    input: ReorderMediaInput,
  ): Promise<Media[]> {
    // Only reorders GALLERY items — singleton roles are excluded at the use case level
    await this.prisma.$transaction(
      input.orderedIds.map((id, index) =>
        this.prisma.media.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return this.findByRole(ownerKey, ownerId, MediaRole.GALLERY);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.media.delete({ where: { id } });
  }

  async renormalize(ownerKey: MediaOwnerKey, ownerId: string): Promise<void> {
    // Only renormalizes GALLERY items — singletons have no order to renormalize
    const items = await this.prisma.media.findMany({
      where: { [ownerKey]: ownerId, role: MediaRole.GALLERY },
      orderBy: { order: 'asc' },
      select: { id: true },
    });

    await this.prisma.$transaction(
      items.map((item, index) =>
        this.prisma.media.update({
          where: { id: item.id },
          data: { order: index },
        }),
      ),
    );
  }

  async countByOwner(ownerKey: MediaOwnerKey, ownerId: string): Promise<number> {
    return this.prisma.media.count({ where: { [ownerKey]: ownerId } });
  }

  async countByRole(ownerKey: MediaOwnerKey, ownerId: string, role: MediaRole): Promise<number> {
    return this.prisma.media.count({ where: { [ownerKey]: ownerId, role } });
  }
}
