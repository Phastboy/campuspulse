import { Injectable, Inject } from '@nestjs/common';
import { SAVES_REPOSITORY } from '../../domain/ports/saves.repository.js';
import type { ISavesRepository } from '../../domain/ports/saves.repository.js';

@Injectable()
export class SavesService {
  constructor(
    @Inject(SAVES_REPOSITORY) private readonly savesRepository: ISavesRepository,
  ) {}

  async toggleListingSave(userId: string, listingId: string) {
    return this.savesRepository.toggleListingSave(userId, listingId);
  }

  async toggleBusinessSave(userId: string, businessId: string) {
    return this.savesRepository.toggleBusinessSave(userId, businessId);
  }

  async getSavedListings(userId: string) {
    return this.savesRepository.getSavedListings(userId);
  }

  async getSavedBusinesses(userId: string) {
    return this.savesRepository.getSavedBusinesses(userId);
  }

  async checkSavedListings(userId: string, listingIds: string[]) {
    return this.savesRepository.checkSavedListings(userId, listingIds);
  }

  async checkSavedBusinesses(userId: string, businessIds: string[]) {
    return this.savesRepository.checkSavedBusinesses(userId, businessIds);
  }
}
