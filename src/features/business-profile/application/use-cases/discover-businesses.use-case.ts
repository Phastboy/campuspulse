import { Injectable } from '@nestjs/common';
import { IBusinessProfileRepository } from '../../domain/ports/business-profile.repository.port.js';
import {
  DiscoverBusinessesInput,
  PaginatedBusinessSummaries,
} from '../../domain/types/business-profile.types.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class DiscoverBusinessesUseCase {
  constructor(private readonly repo: IBusinessProfileRepository) {}

  async execute(raw: {
    search?: string;
    page?: string;
    limit?: string;
    lat?: string;
    lng?: string;
    radius?: string;
  }): Promise<PaginatedBusinessSummaries> {
    const input: DiscoverBusinessesInput = {
      page: this.#parsePage(raw.page),
      limit: this.#parseLimit(raw.limit),
      ...(raw.search !== undefined && { search: raw.search }),
      ...(raw.lat !== undefined && { lat: parseFloat(raw.lat) }),
      ...(raw.lng !== undefined && { lng: parseFloat(raw.lng) }),
      ...(raw.radius !== undefined && { radiusInKm: parseFloat(raw.radius) }),
    };

    return this.repo.discover(input);
  }

  #parsePage(raw: string | undefined): number {
    const n = parseInt(raw ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_PAGE;
  }

  #parseLimit(raw: string | undefined): number {
    const n = parseInt(raw ?? '', 10);
    if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
    return Math.min(n, MAX_LIMIT);
  }
}
