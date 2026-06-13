import { StoreTourStatus, StoreTourHighlight, StoreTourMediaItem } from './store-tour.entity.js';

export interface CreateStoreTourInput {
  readonly businessProfileId: string;
  readonly title: string;
  readonly summary?: string;
  readonly visitDate: Date;
  readonly highlights?: string[];
  readonly createdById: string;
}

export interface UpdateStoreTourInput {
  readonly title?: string;
  readonly summary?: string | null;
  readonly visitDate?: Date;
  readonly highlights?: string[];
  readonly status?: StoreTourStatus;
}

export interface StoreTourView {
  readonly id: string;
  readonly businessProfileId: string;
  readonly title: string;
  readonly summary: string | null;
  readonly visitDate: Date;
  readonly status: StoreTourStatus;
  readonly publishedAt: Date | null;
  readonly createdById: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly highlights: StoreTourHighlight[];
  readonly media: StoreTourMediaItem[];
}

export interface DiscoverStoreToursInput {
  readonly businessProfileId: string;
  readonly status?: StoreTourStatus;
  readonly page: number;
  readonly limit: number;
}

export interface PaginatedStoreTours {
  readonly items: StoreTourView[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
