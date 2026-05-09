import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IVenueRepository } from '../core/ports/venue.repository.interface.js';
import { Prisma } from '../../../generated/prisma/client.js';
import { GetVenuesFilterDto } from '../delivery/http/dto/get-venues-filter.dto.js';
import { CreateVenueDto } from '../delivery/http/dto/create-venue.dto.js';
import {
  EventCentreDiscoveryEntity,
  EventCentreDetailedEntity,
} from '../core/domain/venue.types.js';

@Injectable()
export class PrismaVenueRepository implements IVenueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filters: GetVenuesFilterDto,
  ): Promise<{ data: EventCentreDiscoveryEntity[]; total: number }> {
    const { location, minCapacity, maxPrice, amenities, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.EventCentreWhereInput = {
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(minCapacity && { capacity: { gte: minCapacity } }),
      ...(maxPrice != null && {
        OR: [{ priceRangeMax: { lte: maxPrice } }, { priceRangeMin: { lte: maxPrice } }],
      }),
      ...(amenities &&
        amenities.length > 0 && {
          amenities: {
            some: { name: { in: amenities } },
          },
        }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.eventCentre.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          media: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          amenities: true,
        },
      }),
      this.prisma.eventCentre.count({ where: whereClause }),
    ]);

    // Prisma's generated payload structurally satisfies EventCentreDiscoveryEntity
    return { data: data, total };
  }

  async create(accountId: string, payload: CreateVenueDto): Promise<EventCentreDetailedEntity> {
    // Resolve the internal User ID from the Auth Account ID
    const user = await this.prisma.user.findUnique({
      where: { accountId },
      select: { id: true },
    });

    if (!user) throw new UnauthorizedException('User profile not found for this account');

    const slug = `${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    return await this.prisma.eventCentre.create({
      data: {
        slug,
        ownerId: user.id,
        name: payload.name,
        description: payload.description,
        location: payload.location,
        address: payload.address,
        capacity: payload.capacity,
        priceRangeMin: payload.priceRangeMin,
        priceRangeMax: payload.priceRangeMax,
        contactPhone: payload.contactPhone,
        contactWhatsapp: payload.contactWhatsapp,
        media: payload.media
          ? {
              create: payload.media.map((m) => ({ ...m })),
            }
          : undefined,
        perks: payload.perks
          ? {
              create: payload.perks.map((p) => ({ ...p })),
            }
          : undefined,
        amenities: payload.amenities
          ? {
              connectOrCreate: payload.amenities.map((name) => ({
                where: { name },
                create: { name },
              })),
            }
          : undefined,
      },
      include: { media: true, perks: true, amenities: true },
    });
  }
}
