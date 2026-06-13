import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IStoreTourRepository } from '../domain/ports/store-tour.repository.port.js';
import { StoreTour, StoreTourStatus } from '../domain/types/store-tour.entity.js';
import {
  CreateStoreTourInput,
  DiscoverStoreToursInput,
  PaginatedStoreTours,
  StoreTourView,
  UpdateStoreTourInput,
} from '../domain/types/store-tour.types.js';
import {
  StoreTour as PrismaStoreTour,
  StoreTourHighlight as PrismaStoreTourHighlight,
  StoreTourStatus as PrismaStoreTourStatus,
  Media as PrismaMedia,
} from '../../../../generated/prisma/client.js';

type PrismaStoreTourWithRelations = PrismaStoreTour & {
  highlights: PrismaStoreTourHighlight[];
  media: PrismaMedia[];
};

function toDomain(raw: PrismaStoreTourWithRelations): StoreTour {
  const sortedMedia = (raw.media ?? []).toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return {
    id: raw.id,
    businessProfileId: raw.businessProfileId,
    title: raw.title,
    summary: raw.summary,
    visitDate: raw.visitDate,
    status: raw.status as StoreTourStatus,
    publishedAt: raw.publishedAt,
    createdById: raw.createdById,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    highlights: raw.highlights.map((h) => ({ id: h.id, value: h.value })),
    media: sortedMedia.map((m) => ({
      id: m.id,
      url: m.url,
      mediaType: m.mediaType,
      order: m.order,
      createdAt: m.createdAt,
    })),
  };
}

function toView(raw: PrismaStoreTourWithRelations): StoreTourView {
  return toDomain(raw);
}

@Injectable()
export class PrismaStoreTourRepository extends IStoreTourRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(input: CreateStoreTourInput): Promise<StoreTour> {
    const raw = await this.prisma.storeTour.create({
      data: {
        businessProfileId: input.businessProfileId,
        title: input.title,
        summary: input.summary ?? null,
        visitDate: input.visitDate,
        createdById: input.createdById,
        status: PrismaStoreTourStatus.DRAFT,
        highlights: {
          create: input.highlights?.map((value) => ({ value })) ?? [],
        },
      },
      include: {
        highlights: true,
        media: true,
      },
    });
    return toDomain(raw);
  }

  async findById(id: string): Promise<StoreTourView | null> {
    const raw = await this.prisma.storeTour.findUnique({
      where: { id },
      include: {
        highlights: true,
        media: true,
      },
    });
    return raw ? toView(raw) : null;
  }

  async update(id: string, input: UpdateStoreTourInput): Promise<StoreTour> {
    const raw = await this.prisma.$transaction(async (tx) => {
      if (input.highlights !== undefined) {
        // Replace all highlights if provided
        await tx.storeTourHighlight.deleteMany({
          where: { storeTourId: id },
        });
      }

      const publishedAtUpdate =
        input.status === StoreTourStatus.PUBLISHED ? { publishedAt: new Date() } : {};

      return tx.storeTour.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.summary !== undefined && { summary: input.summary }),
          ...(input.visitDate !== undefined && { visitDate: input.visitDate }),
          ...(input.status !== undefined && { status: input.status as PrismaStoreTourStatus }),
          ...publishedAtUpdate,
          ...(input.highlights !== undefined && {
            highlights: {
              create: input.highlights.map((value) => ({ value })),
            },
          }),
        },
        include: {
          highlights: true,
          media: true,
        },
      });
    });

    return toDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.storeTour.delete({
      where: { id },
    });
  }

  async discover(input: DiscoverStoreToursInput): Promise<PaginatedStoreTours> {
    const where = {
      businessProfileId: input.businessProfileId,
      ...(input.status && { status: input.status as PrismaStoreTourStatus }),
    };

    const skip = (input.page - 1) * input.limit;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.storeTour.findMany({
        where,
        skip,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          highlights: true,
          media: true,
        },
      }),
      this.prisma.storeTour.count({ where }),
    ]);

    return {
      items: rows.map((r) => toView(r)),
      total,
      page: input.page,
      limit: input.limit,
    };
  }
}
