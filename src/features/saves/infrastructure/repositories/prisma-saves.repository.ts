import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { ISavesRepository, SavedListingItem, SavedBusinessItem } from '../../domain/ports/saves.repository.js';

@Injectable()
export class PrismaSavesRepository implements ISavesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async toggleListingSave(userId: string, listingId: string): Promise<{ saved: boolean }> {
    const existing = await this.prisma.savedListing.findUnique({
      where: {
        userId_listingId: { userId, listingId }
      }
    });

    if (existing) {
      await this.prisma.savedListing.delete({
        where: { id: existing.id }
      });
      return { saved: false };
    } else {
      await this.prisma.savedListing.create({
        data: { userId, listingId }
      });
      return { saved: true };
    }
  }

  async toggleBusinessSave(userId: string, businessId: string): Promise<{ saved: boolean }> {
    const existing = await this.prisma.savedBusiness.findUnique({
      where: {
        userId_businessProfileId: { userId, businessProfileId: businessId }
      }
    });

    if (existing) {
      await this.prisma.savedBusiness.delete({
        where: { id: existing.id }
      });
      return { saved: false };
    } else {
      await this.prisma.savedBusiness.create({
        data: { userId, businessProfileId: businessId }
      });
      return { saved: true };
    }
  }

  async getSavedListings(userId: string): Promise<SavedListingItem[]> {
    return this.prisma.savedListing.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            businessProfile: true,
            media: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSavedBusinesses(userId: string): Promise<SavedBusinessItem[]> {
    return this.prisma.savedBusiness.findMany({
      where: { userId },
      include: {
        businessProfile: {
          include: {
            media: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async checkSavedListings(userId: string, listingIds: string[]): Promise<Record<string, boolean>> {
    const saved = await this.prisma.savedListing.findMany({
      where: {
        userId,
        listingId: { in: listingIds }
      }
    });
    const map: Record<string, boolean> = {};
    for (const s of saved) {
      map[s.listingId] = true;
    }
    return map;
  }

  async checkSavedBusinesses(userId: string, businessIds: string[]): Promise<Record<string, boolean>> {
    const saved = await this.prisma.savedBusiness.findMany({
      where: {
        userId,
        businessProfileId: { in: businessIds }
      }
    });
    const map: Record<string, boolean> = {};
    for (const s of saved) {
      map[s.businessProfileId] = true;
    }
    return map;
  }
}
