import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IBusinessProfileRepository } from '../domain/ports/business-profile.repository.port.js';
import { BusinessProfile } from '../domain/types/business-profile.entity.js';
import {
  CreateBusinessProfileInput,
  DiscoverBusinessesInput,
  PaginatedBusinessSummaries,
  UpdateBusinessProfileInput,
} from '../domain/types/business-profile.types.js';

// Post-migration type guard
type PrismaBusinessProfileExtended = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  verificationStatus: BusinessProfile['verificationStatus'];
  isPublic: boolean;
  description: string | null;
  phoneNumber: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  categoryId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toDomain(raw: PrismaBusinessProfileExtended): BusinessProfile {
  return {
    id: raw.id,
    ownerId: raw.ownerId,
    name: raw.name,
    slug: raw.slug,
    verificationStatus: raw.verificationStatus,
    isPublic: raw.isPublic,
    description: raw.description,
    phoneNumber: raw.phoneNumber,
    whatsapp: raw.whatsapp,
    email: raw.email,
    location: raw.location,
    categoryId: raw.categoryId ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

@Injectable()
export class PrismaBusinessProfileRepository extends IBusinessProfileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(input: CreateBusinessProfileInput, slug: string): Promise<BusinessProfile> {
    const raw = await this.prisma.businessProfile.create({
      data: { ...input, slug },
    });
    return toDomain(raw);
  }

  async findById(id: string): Promise<BusinessProfile | null> {
    const raw = await this.prisma.businessProfile.findUnique({ where: { id } });
    return raw ? toDomain(raw) : null;
  }

  async findBySlug(slug: string): Promise<BusinessProfile | null> {
    const raw = await this.prisma.businessProfile.findUnique({ where: { slug } });
    return raw ? toDomain(raw) : null;
  }

  async isSlugTaken(slug: string): Promise<boolean> {
    const count = await this.prisma.businessProfile.count({ where: { slug } });
    return count > 0;
  }

  async findByOwner(ownerId: string): Promise<BusinessProfile[]> {
    const rows = await this.prisma.businessProfile.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => toDomain(r as unknown as PrismaBusinessProfileExtended));
  }

  async update(id: string, input: UpdateBusinessProfileInput): Promise<BusinessProfile> {
    const raw = await this.prisma.businessProfile.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.phoneNumber !== undefined && { phoneNumber: input.phoneNumber }),
        ...(input.whatsapp !== undefined && { whatsapp: input.whatsapp }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      },
    });
    return toDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.businessProfile.delete({ where: { id } });
  }

  async discover(input: DiscoverBusinessesInput): Promise<PaginatedBusinessSummaries> {
    const where: Prisma.BusinessProfileWhereInput = {
      isPublic: true,
      ...(input.verificationStatus && { verificationStatus: input.verificationStatus }),
      // Category filter: exact leaf or root-slug relation filter
      ...(input.categoryId && { categoryId: input.categoryId }),
      ...(input.rootSlug &&
        !input.categoryId && {
          category: { parent: { slug: input.rootSlug } },
        }),
      ...(input.search && {
        OR: [
          { name: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
          { location: { contains: input.search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (input.page - 1) * input.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.businessProfile.findMany({
        where,
        skip,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          verificationStatus: true,
          description: true,
          location: true,
          categoryId: true,
        },
      }),
      this.prisma.businessProfile.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        ...r,
        categoryId: (r as { categoryId?: string | null }).categoryId ?? null,
      })),
      total,
      page: input.page,
      limit: input.limit,
    };
  }
}
