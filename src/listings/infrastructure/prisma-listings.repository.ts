import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IListingRepository } from '../core/ports/listing.repository.interface.js';
import { CreateListingDto } from '../delivery/http/dto/create-listing.dto.js';
import { GetListingsFilterDto } from '../delivery/http/dto/get-listings-filter.dto.js';
import { ListingView } from '../core/domain/listing.view.js';
import { Prisma } from '../../../generated/prisma/client.js';
import { ListingMapper } from './mappers/listing.mapper.js';

@Injectable()
export class PrismaListingsRepository implements IListingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: GetListingsFilterDto): Promise<{ data: ListingView[]; total: number }> {
    const { category, minPrice, maxPrice, search, attributes, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      ...(category && { category: { slug: category } }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            basePrice: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    if (attributes && Object.keys(attributes).length > 0) {
      where.AND = Object.entries(attributes).map(([key, value]) => ({
        attributes: { path: [key], equals: value },
      }));
    }

    /**
     * 1. Capture the raw results in a variable.
     * This variable 'rawListings' is now strictly typed by Prisma.
     */
    const [rawListings, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          media: true,
          owner: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listing.count({ where }),
    ]);

    /**
     * 2. Map the variable.
     * ListingMapper.toView now receives the exact type it expects.
     */
    return {
      data: rawListings.map((listing) => ListingMapper.toView(listing)),
      total,
    };
  }

  async create(accountId: string, payload: CreateListingDto): Promise<ListingView> {
    const slug = `${payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const user = await this.prisma.user.findUniqueOrThrow({ where: { accountId } });

    // 1. Capture the raw created listing
    const rawListing = await this.prisma.listing.create({
      data: {
        slug,
        title: payload.title,
        description: payload.description,
        basePrice: payload.basePrice,
        currency: payload.currency,
        attributes: payload.attributes as Prisma.JsonObject,
        categoryId: payload.categoryId,
        ownerId: user.id,
      },
      include: { category: true, media: true, owner: { select: { name: true, avatarUrl: true } } },
    });

    // 2. Map to Domain View
    return ListingMapper.toView(rawListing);
  }

  async findBySlug(slug: string): Promise<ListingView | null> {
    const rawListing = await this.prisma.listing.findUnique({
      where: { slug },
      include: {
        category: true,
        media: true,
        owner: { select: { name: true, avatarUrl: true } },
      },
    });

    if (!rawListing) return null;

    return ListingMapper.toView(rawListing);
  }

  async findById(id: string): Promise<ListingView | null> {
    const rawListing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        category: true,
        media: true,
        owner: { select: { name: true, avatarUrl: true } },
      },
    });

    if (!rawListing) return null;

    return ListingMapper.toView(rawListing);
  }
}
