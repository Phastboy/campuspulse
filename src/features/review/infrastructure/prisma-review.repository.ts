import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IReviewRepository } from '../domain/ports/review.repository.port.js';
import { Review } from '../domain/types/review.entity.js';
import {
  CreateReviewInput,
  UpdateReviewInput,
  GetBusinessReviewsInput,
  ReviewPage,
  ReviewWithMedia,
  ReviewMediaItem,
} from '../domain/types/review.types.js';
import {
  MediaResourceType as PrismaMediaResourceType,
  MediaRole as PrismaMediaRole,
} from '../../../../generated/prisma/client.js';
import type {
  Review as PrismaReview,
  Media as PrismaMedia,
} from '../../../../generated/prisma/client.js';

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function toDomain(raw: PrismaReview): Review {
  return {
    id: raw.id,
    businessProfileId: raw.businessProfileId,
    reviewerId: raw.reviewerId,
    rating: raw.rating,
    comment: raw.comment,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mediaItemFromRaw(raw: PrismaMedia): ReviewMediaItem {
  return {
    id: raw.id,
    url: raw.url,
    mediaType: raw.mediaType,
    order: raw.order,
    createdAt: raw.createdAt,
  };
}

function toWithMedia(raw: PrismaReview & { media: PrismaMedia[] }): ReviewWithMedia {
  const sorted = [...raw.media].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return {
    ...toDomain(raw),
    media: sorted.map(mediaItemFromRaw),
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

@Injectable()
export class PrismaReviewRepository extends IReviewRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(input: CreateReviewInput): Promise<Review> {
    const raw = await this.prisma.review.create({
      data: {
        businessProfileId: input.businessProfileId,
        reviewerId: input.reviewerId,
        rating: input.rating,
        comment: input.comment ?? null,
      },
    });
    return toDomain(raw);
  }

  async findById(id: string): Promise<Review | null> {
    const raw = await this.prisma.review.findUnique({ where: { id } });
    return raw ? toDomain(raw) : null;
  }

  async findByIdWithMedia(id: string): Promise<ReviewWithMedia | null> {
    const raw = await this.prisma.review.findUnique({
      where: { id },
      include: {
        media: {
          where: {
            resourceType: PrismaMediaResourceType.REVIEW,
            role: PrismaMediaRole.GALLERY,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    return raw ? toWithMedia(raw) : null;
  }

  async existsByBusinessAndReviewer(
    businessProfileId: string,
    reviewerId: string,
  ): Promise<boolean> {
    const count = await this.prisma.review.count({
      where: { businessProfileId, reviewerId },
    });
    return count > 0;
  }

  async findByBusiness(input: GetBusinessReviewsInput): Promise<ReviewPage> {
    const limit = input.limit ?? 20;

    const rows = await this.prisma.review.findMany({
      where: { businessProfileId: input.businessProfileId },
      include: {
        media: {
          where: {
            resourceType: PrismaMediaResourceType.REVIEW,
            role: PrismaMediaRole.GALLERY,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1, // fetch one extra to detect next page
      ...(input.cursor
        ? {
            cursor: { id: input.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;

    return {
      items: items.map(toWithMedia),
      nextCursor: hasNextPage ? items[items.length - 1].id : null,
    };
  }

  async update(id: string, input: UpdateReviewInput): Promise<Review> {
    const raw = await this.prisma.review.update({
      where: { id },
      data: {
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.comment !== undefined && { comment: input.comment }),
      },
    });
    return toDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.review.delete({ where: { id } });
  }
}
