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
  BusinessProfileView,
} from '../domain/types/business-profile.types.js';
import { SetOperatingHoursInput, DayOfWeek } from '../domain/types/operating-hours.types.js';

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
  locationId: string | null;
  categoryId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  hours?: {
    id: string;
    businessProfileId: string;
    day: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[];
  tags?: {
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  geoEntity?: {
    id: string;
    name: string;
  } | null;
};

type HydratedProfile = PrismaBusinessProfileExtended & {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
};

function toDomain(raw: HydratedProfile): BusinessProfileView {
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
    locationId: raw.locationId,
    location: raw.locationName,
    latitude: raw.latitude,
    longitude: raw.longitude,
    categoryId: raw.categoryId ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    operatingHours: raw.hours?.map((h) => ({
      id: h.id,
      businessProfileId: h.businessProfileId,
      day: h.day as DayOfWeek,
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed,
    })),
    tags: raw.tags?.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
      slug: t.tag.slug,
    })),
  };
}

@Injectable()
export class PrismaBusinessProfileRepository extends IBusinessProfileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private async hydrate(profiles: PrismaBusinessProfileExtended[]): Promise<HydratedProfile[]> {
    if (profiles.length === 0) return [];

    const locationIds = profiles.map((p) => p.locationId).filter((id): id is string => id !== null);
    const locationMap = new Map<string, { lat: number; lng: number }>();

    if (locationIds.length > 0) {
      const coords = await this.prisma.$queryRaw<{ id: string; lat: number; lng: number }[]>`
        SELECT id, ST_Y(coordinates::geometry) as lat, ST_X(coordinates::geometry) as lng
        FROM "Location"
        WHERE id IN (${Prisma.join(locationIds)})
      `;
      for (const row of coords) {
        locationMap.set(row.id, { lat: row.lat, lng: row.lng });
      }
    }

    return profiles.map((p) => {
      const coords = p.locationId ? locationMap.get(p.locationId) : undefined;
      return {
        ...p,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        locationName: p.geoEntity?.name ?? null,
      };
    });
  }

  async create(input: CreateBusinessProfileInput, slug: string): Promise<BusinessProfileView> {
    let locationId: string | undefined = undefined;

    if (input.latitude !== undefined && input.longitude !== undefined) {
      const newLocId = crypto.randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO "Location" (id, name, coordinates)
        VALUES (${newLocId}, ${input.location ?? 'Business Location'}, ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326))
      `;
      locationId = newLocId;
    }

    const raw = await this.prisma.businessProfile.create({
      data: {
        ownerId: input.ownerId,
        name: input.name,
        slug,
        description: input.description,
        phoneNumber: input.phoneNumber,
        whatsapp: input.whatsapp,
        email: input.email,
        locationId,
      },
      include: { geoEntity: true },
    });

    const [hydrated] = await this.hydrate([raw]);
    return toDomain(hydrated);
  }

  async findById(id: string): Promise<BusinessProfileView | null> {
    const raw = await this.prisma.businessProfile.findUnique({
      where: { id },
      include: { hours: true, tags: { include: { tag: true } }, geoEntity: true },
    });
    if (!raw) return null;
    const [hydrated] = await this.hydrate([raw]);
    return toDomain(hydrated);
  }

  async findBySlug(slug: string): Promise<BusinessProfileView | null> {
    const raw = await this.prisma.businessProfile.findUnique({
      where: { slug },
      include: { hours: true, tags: { include: { tag: true } }, geoEntity: true },
    });
    if (!raw) return null;
    const [hydrated] = await this.hydrate([raw]);
    return toDomain(hydrated);
  }

  async isSlugTaken(slug: string): Promise<boolean> {
    const count = await this.prisma.businessProfile.count({ where: { slug } });
    return count > 0;
  }

  async findByOwner(ownerId: string): Promise<BusinessProfileView[]> {
    const rows = await this.prisma.businessProfile.findMany({
      where: { ownerId },
      include: { hours: true, tags: { include: { tag: true } }, geoEntity: true },
      orderBy: { createdAt: 'desc' },
    });
    const hydrated = await this.hydrate(rows);
    return hydrated.map(toDomain);
  }

  async update(id: string, input: UpdateBusinessProfileInput): Promise<BusinessProfileView> {
    const existing = await this.prisma.businessProfile.findUnique({ where: { id } });
    if (!existing) throw new Error('BusinessProfile not found');

    let locationId = existing.locationId;

    if (input.latitude !== undefined && input.longitude !== undefined) {
      if (locationId) {
        await this.prisma.$executeRaw`
          UPDATE "Location"
          SET coordinates = ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326),
              name = COALESCE(${input.location ?? null}, name)
          WHERE id = ${locationId}
        `;
      } else {
        const newLocId = crypto.randomUUID();
        await this.prisma.$executeRaw`
          INSERT INTO "Location" (id, name, coordinates)
          VALUES (${newLocId}, ${input.location ?? 'Business Location'}, ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326))
        `;
        locationId = newLocId;
      }
    } else if (input.location !== undefined && locationId) {
      await this.prisma.$executeRaw`
        UPDATE "Location" SET name = ${input.location} WHERE id = ${locationId}
      `;
    }

    const raw = await this.prisma.businessProfile.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.phoneNumber !== undefined && { phoneNumber: input.phoneNumber }),
        ...(input.whatsapp !== undefined && { whatsapp: input.whatsapp }),
        ...(input.email !== undefined && { email: input.email }),
        ...(locationId !== undefined && { locationId }),
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      },
      include: { hours: true, tags: { include: { tag: true } }, geoEntity: true },
    });

    const [hydrated] = await this.hydrate([raw]);
    return toDomain(hydrated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.businessProfile.delete({ where: { id } });
  }

  async setOperatingHours(businessId: string, hours: SetOperatingHoursInput[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.operatingHours.deleteMany({
        where: { businessProfileId: businessId },
      });
      if (hours.length > 0) {
        await tx.operatingHours.createMany({
          data: hours.map((h) => ({
            businessProfileId: businessId,
            day: h.day,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          })),
        });
      }
    });
  }

  async setTags(businessId: string, tagIds: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.businessProfileTag.deleteMany({
        where: { businessProfileId: businessId },
      });
      if (tagIds.length > 0) {
        await tx.businessProfileTag.createMany({
          data: tagIds.map((tagId) => ({
            businessProfileId: businessId,
            tagId,
          })),
        });
      }
    });
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
          { geoEntity: { name: { contains: input.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const skip = (input.page - 1) * input.limit;

    if (input.lat !== undefined && input.lng !== undefined) {
      const radiusMeters = (input.radiusInKm ?? 10) * 1000;

      const rawItems = await this.prisma.$queryRaw<
        {
          id: string;
          name: string;
          slug: string;
          verificationStatus: BusinessProfile['verificationStatus'];
          description: string | null;
          location: string | null;
          latitude: number;
          longitude: number;
          categoryId: string | null;
          distance: number;
        }[]
      >`
        SELECT bp.id, bp.name, bp.slug, bp."verificationStatus", bp.description, loc.name as location, 
               ST_Y(loc.coordinates::geometry) as latitude, ST_X(loc.coordinates::geometry) as longitude, bp."categoryId",
               (ST_Distance(loc.coordinates::geography, ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography) / 1000) AS distance
        FROM "business_profiles" bp
        JOIN "Location" loc ON bp."locationId" = loc.id
        WHERE bp."isPublic" = true
          AND ST_DWithin(loc.coordinates::geography, ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography, ${radiusMeters})
          ${input.verificationStatus ? Prisma.sql`AND bp."verificationStatus" = ${input.verificationStatus}::"VerificationStatus"` : Prisma.empty}
          ${input.categoryId ? Prisma.sql`AND bp."categoryId" = ${input.categoryId}` : Prisma.empty}
          ${
            input.search
              ? Prisma.sql`AND (
                  bp.name ILIKE ${'%' + input.search + '%'} OR 
                  bp.description ILIKE ${'%' + input.search + '%'} OR 
                  loc.name ILIKE ${'%' + input.search + '%'}
                )`
              : Prisma.empty
          }
        ORDER BY distance ASC
        LIMIT ${input.limit}
        OFFSET ${skip};
      `;

      const countResult = await this.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*) as total 
        FROM "business_profiles" bp
        JOIN "Location" loc ON bp."locationId" = loc.id
        WHERE bp."isPublic" = true
          AND ST_DWithin(loc.coordinates::geography, ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography, ${radiusMeters})
          ${input.verificationStatus ? Prisma.sql`AND bp."verificationStatus" = ${input.verificationStatus}::"VerificationStatus"` : Prisma.empty}
          ${input.categoryId ? Prisma.sql`AND bp."categoryId" = ${input.categoryId}` : Prisma.empty}
          ${
            input.search
              ? Prisma.sql`AND (
                  bp.name ILIKE ${'%' + input.search + '%'} OR 
                  bp.description ILIKE ${'%' + input.search + '%'} OR 
                  loc.name ILIKE ${'%' + input.search + '%'}
                )`
              : Prisma.empty
          };
      `;

      const total = Number(countResult[0]?.total ?? 0);

      return {
        items: rawItems.map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          verificationStatus: r.verificationStatus,
          description: r.description,
          location: r.location,
          latitude: r.latitude,
          longitude: r.longitude,
          categoryId: r.categoryId ?? null,
          distanceKm: Number(r.distance),
        })),
        total,
        page: input.page,
        limit: input.limit,
      };
    }

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
          locationId: true,
          categoryId: true,
          geoEntity: true,
        },
      }),
      this.prisma.businessProfile.count({ where }),
    ]);

    const hydrated = await this.hydrate(items as unknown as PrismaBusinessProfileExtended[]);

    return {
      items: hydrated.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        verificationStatus: r.verificationStatus,
        description: r.description,
        location: r.locationName,
        latitude: r.latitude,
        longitude: r.longitude,
        categoryId: r.categoryId ?? null,
      })),
      total,
      page: input.page,
      limit: input.limit,
    };
  }
}
