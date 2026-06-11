import { Injectable } from '@nestjs/common';
import { Prisma, Listing as PrismaListing } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IListingRepository } from '../domain/ports/listing.repository.port.js';
import { Listing } from '../domain/types/listing.entity.js';
import { ListingStatus } from '../domain/types/listing-status.enum.js';
import {
  CreateListingInput,
  DiscoverListingsInput,
  PaginatedListingSummaries,
  TransitionListingStatusInput,
  UpdateListingInput,
} from '../domain/types/listing.types.js';

type PrismaListingExtended = PrismaListing & {
  categoryId?: string | null;
  reviews?: {
    id: string;
    reviewerId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
  }[];
};

function toDomain(raw: PrismaListingExtended): Listing {
  return {
    id: raw.id,
    businessProfileId: raw.businessProfileId,
    title: raw.title,
    slug: raw.slug,
    description: raw.description,
    status: raw.status,
    categoryId: raw.categoryId ?? null,
    price: {
      minPrice: raw.minPrice !== null ? raw.minPrice.toNumber() : null,
      maxPrice: raw.maxPrice !== null ? raw.maxPrice.toNumber() : null,
      currencyCode: raw.currencyCode,
      isNegotiable: raw.isNegotiable,
    },
    attributes: raw.attributes ? (raw.attributes as Record<string, unknown>) : null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    ...(raw.reviews && {
      reviews: raw.reviews.map((r) => ({
        id: r.id,
        reviewerId: r.reviewerId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    }),
  };
}

@Injectable()
export class PrismaListingRepository extends IListingRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(input: CreateListingInput, slug: string): Promise<Listing> {
    const raw = await this.prisma.listing.create({
      data: {
        businessProfileId: input.businessProfileId,
        title: input.title,
        categoryId: input.categoryId,
        slug,
        description: input.description ?? null,
        ...(input.price?.minPrice !== undefined && { minPrice: input.price.minPrice }),
        ...(input.price?.maxPrice !== undefined && { maxPrice: input.price.maxPrice }),
        ...(input.price?.currencyCode !== undefined && { currencyCode: input.price.currencyCode }),
        ...(input.price?.isNegotiable !== undefined && { isNegotiable: input.price.isNegotiable }),
        ...(input.attributes !== undefined && { attributes: input.attributes as Prisma.InputJsonValue }),
      },
    });
    return toDomain(raw);
  }

  async findById(id: string): Promise<Listing | null> {
    const raw = await this.prisma.listing.findUnique({
      where: { id },
      include: { reviews: true },
    });
    return raw ? toDomain(raw) : null;
  }

  async findBySlug(slug: string): Promise<Listing | null> {
    const raw = await this.prisma.listing.findFirst({
      where: { slug },
      include: { reviews: true },
    });
    return raw ? toDomain(raw) : null;
  }

  async isSlugTaken(businessProfileId: string, slug: string): Promise<boolean> {
    const count = await this.prisma.listing.count({
      where: { businessProfileId, slug },
    });
    return count > 0;
  }

  async findByBusinessProfile(businessProfileId: string): Promise<Listing[]> {
    const rows = await this.prisma.listing.findMany({
      where: { businessProfileId },
      include: { reviews: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => toDomain(r as PrismaListingExtended));
  }

  async update(id: string, input: UpdateListingInput): Promise<Listing> {
    const raw = await this.prisma.listing.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.price !== undefined && {
          minPrice: input.price.minPrice ?? null,
          maxPrice: input.price.maxPrice ?? null,
          currencyCode: input.price.currencyCode ?? null,
          isNegotiable: input.price.isNegotiable,
        }),
        ...(input.attributes !== undefined && {
          attributes: input.attributes === null ? Prisma.DbNull : (input.attributes as Prisma.InputJsonValue),
        }),
      },
    });
    return toDomain(raw);
  }

  async transitionStatus(id: string, input: TransitionListingStatusInput): Promise<Listing> {
    const raw = await this.prisma.listing.update({
      where: { id },
      data: { status: input.status },
    });
    return toDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.listing.delete({ where: { id } });
  }

  async discover(input: DiscoverListingsInput): Promise<PaginatedListingSummaries> {
    const where: Prisma.ListingWhereInput = {
      status: input.status ?? ListingStatus.PUBLISHED,
      ...(input.businessProfileId && { businessProfileId: input.businessProfileId }),
      ...(input.currencyCode && { currencyCode: input.currencyCode }),
      ...(input.isNegotiable !== undefined && { isNegotiable: input.isNegotiable }),
      ...(input.minPrice !== undefined && { minPrice: { gte: input.minPrice } }),
      ...(input.maxPrice !== undefined && { maxPrice: { lte: input.maxPrice } }),
      // Category filter: exact leaf or set of leaves under a root slug
      ...(input.categoryId && { categoryId: input.categoryId }),
      ...(input.rootSlug &&
        !input.categoryId && {
          category: { parent: { slug: input.rootSlug } },
        }),
      ...(input.search && {
        OR: [
          { title: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (input.page - 1) * input.limit;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        skip,
        take: input.limit,
        include: { 
          reviews: true,
          media: {
            where: { role: 'COVER' },
            take: 1,
            select: { url: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: rows.map((r) => ({
        ...r,
        minPrice: r.minPrice !== null ? r.minPrice.toNumber() : null,
        maxPrice: r.maxPrice !== null ? r.maxPrice.toNumber() : null,
        currencyCode: r.currencyCode ?? null,
        categoryId: (r as { categoryId?: string | null }).categoryId ?? null,
        coverUrl: (r as any).media?.[0]?.url ?? undefined,
        attributes: r.attributes ? (r.attributes as Record<string, unknown>) : null,
      })),
      total,
      page: input.page,
      limit: input.limit,
    };
  }
}
