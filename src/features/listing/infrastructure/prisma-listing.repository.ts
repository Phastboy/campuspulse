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

// Cast to include categoryId that exists post-migration
type PrismaListingExtended = PrismaListing & { categoryId?: string | null };

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
      currency: raw.currency,
      isNegotiable: raw.isNegotiable,
    },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
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
        slug,
        description: input.description ?? null,
        minPrice: input.price?.minPrice ?? null,
        maxPrice: input.price?.maxPrice ?? null,
        currency: input.price?.currency ?? null,
        isNegotiable: input.price?.isNegotiable ?? false,
      },
    });
    return toDomain(raw);
  }

  async findById(id: string): Promise<Listing | null> {
    const raw = await this.prisma.listing.findUnique({ where: { id } });
    return raw ? toDomain(raw) : null;
  }

  async findBySlug(slug: string): Promise<Listing | null> {
    const raw = await this.prisma.listing.findFirst({ where: { slug } });
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
        ...(input.price !== undefined && {
          minPrice: input.price.minPrice ?? null,
          maxPrice: input.price.maxPrice ?? null,
          currency: input.price.currency ?? null,
          isNegotiable: input.price.isNegotiable,
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
      ...(input.currency && { currency: input.currency }),
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
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          businessProfileId: true,
          title: true,
          slug: true,
          description: true,
          minPrice: true,
          maxPrice: true,
          currency: true,
          isNegotiable: true,
          coverUrl: true,
          categoryId: true,
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: rows.map((r) => ({
        ...r,
        minPrice: r.minPrice !== null ? r.minPrice.toNumber() : null,
        maxPrice: r.maxPrice !== null ? r.maxPrice.toNumber() : null,
        categoryId: (r as { categoryId?: string | null }).categoryId ?? null,
      })),
      total,
      page: input.page,
      limit: input.limit,
    };
  }
}
