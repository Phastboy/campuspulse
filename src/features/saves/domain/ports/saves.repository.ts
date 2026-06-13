export interface SavedListingItem {
  id: string;
  userId: string;
  listingId: string;
  createdAt: Date;
  listing: any;
}

export interface SavedBusinessItem {
  id: string;
  userId: string;
  businessProfileId: string;
  createdAt: Date;
  businessProfile: any;
}

export const SAVES_REPOSITORY = Symbol('SAVES_REPOSITORY');

export interface ISavesRepository {
  toggleListingSave(userId: string, listingId: string): Promise<{ saved: boolean }>;
  toggleBusinessSave(userId: string, businessId: string): Promise<{ saved: boolean }>;
  
  getSavedListings(userId: string): Promise<SavedListingItem[]>;
  getSavedBusinesses(userId: string): Promise<SavedBusinessItem[]>;
  
  checkSavedListings(userId: string, listingIds: string[]): Promise<Record<string, boolean>>;
  checkSavedBusinesses(userId: string, businessIds: string[]): Promise<Record<string, boolean>>;
}
