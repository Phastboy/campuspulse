import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IBusinessProfileRepository } from '../core/ports/business-profile.repository.interface.js';
import { BusinessProfileView } from '../core/domain/business-profile.view.js';
import { CreateBusinessProfileDto } from '../delivery/http/dto/create-business-profile.dto.js';
import { UpdateBusinessProfileDto } from '../delivery/http/dto/update-business-profile.dto.js';
import { GetBusinessProfilesFilterDto } from '../delivery/http/dto/get-business-profiles-filter.dto.js';
import { Prisma } from '../../../generated/prisma/client.js';
import slugify from 'slugify';

const toView = (
  raw: Prisma.BusinessProfileGetPayload<{ include: { owner: true } }>,
): BusinessProfileView => ({
  id: raw.id,
  slug: raw.slug,
  name: raw.name,
  description: raw.description,
  type: raw.type as BusinessProfileView['type'],
  logoUrl: raw.logoUrl,
  bannerUrl: raw.bannerUrl,
  email: raw.email,
  phoneNumber: raw.phoneNumber,
  whatsapp: raw.whatsapp,
  location: raw.location,
  verificationStatus: raw.verificationStatus as BusinessProfileView['verificationStatus'],
  isPublic: raw.isPublic,
  ownerId: raw.owner.id,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

const INCLUDE = { owner: true } satisfies Prisma.BusinessProfileInclude;

@Injectable()
export class PrismaBusinessProfileRepository implements IBusinessProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, payload: CreateBusinessProfileDto): Promise<BusinessProfileView> {
    const baseSlug = slugify(payload.name, { lower: true, strict: true, trim: true });
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    const raw = await this.prisma.businessProfile.create({
      data: {
        slug,
        name: payload.name,
        description: payload.description,
        type: payload.type ?? 'INDIVIDUAL',
        logoUrl: payload.logoUrl,
        logoId: payload.logoId,
        bannerUrl: payload.bannerUrl,
        bannerId: payload.bannerId,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        whatsapp: payload.whatsapp,
        location: payload.location,
        isPublic: payload.isPublic ?? true,
        ownerId,
      },
      include: INCLUDE,
    });

    return toView(raw);
  }

  async update(
    id: string,
    ownerId: string,
    payload: UpdateBusinessProfileDto,
  ): Promise<BusinessProfileView> {
    const existing = await this.prisma.businessProfile.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!existing) throw new NotFoundException('Business profile not found');
    if (existing.ownerId !== ownerId)
      throw new ForbiddenException('You do not own this business profile');

    const raw = await this.prisma.businessProfile.update({
      where: { id },
      data: {
        name: payload.name,
        description: payload.description,
        type: payload.type,
        logoUrl: payload.logoUrl,
        logoId: payload.logoId,
        bannerUrl: payload.bannerUrl,
        bannerId: payload.bannerId,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        whatsapp: payload.whatsapp,
        location: payload.location,
        isPublic: payload.isPublic,
      },
      include: INCLUDE,
    });

    return toView(raw);
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const existing = await this.prisma.businessProfile.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException('Business profile not found');
    if (existing.ownerId !== ownerId)
      throw new ForbiddenException('You do not own this business profile');

    await this.prisma.businessProfile.delete({ where: { id } });
  }

  async findById(id: string): Promise<BusinessProfileView | null> {
    const raw = await this.prisma.businessProfile.findUnique({ where: { id }, include: INCLUDE });
    return raw ? toView(raw) : null;
  }

  async findBySlug(slug: string): Promise<BusinessProfileView | null> {
    const raw = await this.prisma.businessProfile.findUnique({ where: { slug }, include: INCLUDE });
    return raw ? toView(raw) : null;
  }

  async findPublic(
    filters: GetBusinessProfilesFilterDto,
  ): Promise<{ data: BusinessProfileView[]; total: number }> {
    const { type, location, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.BusinessProfileWhereInput = {
      isPublic: true,
      ...(type && { type }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.businessProfile.findMany({
        where,
        skip,
        take: limit,
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.businessProfile.count({ where }),
    ]);

    return { data: rows.map(toView), total };
  }

  async findByOwnerId(ownerId: string): Promise<BusinessProfileView[]> {
    const rows = await this.prisma.businessProfile.findMany({
      where: { ownerId },
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toView);
  }
}
