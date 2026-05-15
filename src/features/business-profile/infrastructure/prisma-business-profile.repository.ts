import { Injectable } from '@nestjs/common';
import { IBusinessProfileRepository } from '../domain/ports/business-profile.repository.port.js';
import { BusinessProfile } from '../domain/types/business-profile.entity.js';
import {
  CreateBusinessProfileInput,
  DiscoverBusinessesInput,
  PaginatedBusinessSummaries,
  UpdateBusinessProfileBrandingInput,
  UpdateBusinessProfileInput,
} from '../domain/types/business-profile.types.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Prisma } from '../../../../generated/prisma/client.js';

@Injectable()
export class PrismaBusinessProfileRepository extends IBusinessProfileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(input: CreateBusinessProfileInput, slug: string): Promise<BusinessProfile> {
    return this.prisma.businessProfile.create({
      data: {
        ownerId: input.ownerId,
        name: input.name,
        slug,
        businessType: input.businessType,
        description: input.description ?? null,
        phoneNumber: input.phoneNumber ?? null,
        whatsapp: input.whatsapp ?? null,
        email: input.email ?? null,
        location: input.location ?? null,
      },
    });
  }

  async findById(id: string): Promise<BusinessProfile | null> {
    return this.prisma.businessProfile.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<BusinessProfile | null> {
    return this.prisma.businessProfile.findUnique({ where: { slug } });
  }

  async isSlugTaken(slug: string): Promise<boolean> {
    const count = await this.prisma.businessProfile.count({ where: { slug } });
    return count > 0;
  }

  async findByOwner(ownerId: string): Promise<BusinessProfile[]> {
    return this.prisma.businessProfile.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, input: UpdateBusinessProfileInput): Promise<BusinessProfile> {
    return this.prisma.businessProfile.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.businessType !== undefined && { businessType: input.businessType }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.phoneNumber !== undefined && { phoneNumber: input.phoneNumber }),
        ...(input.whatsapp !== undefined && { whatsapp: input.whatsapp }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      },
    });
  }

  async updateBranding(
    id: string,
    input: UpdateBusinessProfileBrandingInput,
  ): Promise<BusinessProfile> {
    return this.prisma.businessProfile.update({
      where: { id },
      data: {
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
        ...(input.logoId !== undefined && { logoId: input.logoId }),
        ...(input.bannerUrl !== undefined && { bannerUrl: input.bannerUrl }),
        ...(input.bannerId !== undefined && { bannerId: input.bannerId }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.businessProfile.delete({ where: { id } });
  }

  async discover(input: DiscoverBusinessesInput): Promise<PaginatedBusinessSummaries> {
    const where: Prisma.BusinessProfileWhereInput = {
      isPublic: true,
      ...(input.businessType && { businessType: input.businessType }),
      ...(input.verificationStatus && { verificationStatus: input.verificationStatus }),
      ...(input.search && {
        OR: [
          { name: { contains: input.search, mode: 'insensitive' as const } },
          { description: { contains: input.search, mode: 'insensitive' as const } },
          { location: { contains: input.search, mode: 'insensitive' as const } },
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
          businessType: true,
          verificationStatus: true,
          description: true,
          logoUrl: true,
          location: true,
        },
      }),
      this.prisma.businessProfile.count({ where }),
    ]);

    return { items, total, page: input.page, limit: input.limit };
  }
}
