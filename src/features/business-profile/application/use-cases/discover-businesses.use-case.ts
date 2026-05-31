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
  }): Promise<PaginatedBusinessSummaries> {
    const input: DiscoverBusinessesInput = {
      search: raw.search,
      page: this.parsePage(raw.page),
      limit: this.parseLimit(raw.limit),
    };

    return this.repo.discover(input);
  }

  private parsePage(raw: string | undefined): number {
    const n = parseInt(raw ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_PAGE;
  }

  private parseLimit(raw: string | undefined): number {
    const n = parseInt(raw ?? '', 10);
    if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
    return Math.min(n, MAX_LIMIT);
  }
}
