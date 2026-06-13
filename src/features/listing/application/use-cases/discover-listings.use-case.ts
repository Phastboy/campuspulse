import { Injectable } from '@nestjs/common';
import { IListingRepository } from '../../domain/ports/listing.repository.port.js';

import {
  DiscoverListingsInput,
  PaginatedListingSummaries,
} from '../../domain/types/listing.types.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class DiscoverListingsUseCase {
  constructor(private readonly repo: IListingRepository) {}

  async execute(raw: {
    businessProfileId?: string;
    currencyCode?: string;
    minPrice?: string;
    maxPrice?: string;
    isNegotiable?: string;
    search?: string;
    page?: string;
    limit?: string;
    attributes?: string;
  }): Promise<PaginatedListingSummaries> {
    const minPrice = this.#parseNumber(raw.minPrice);
    const maxPrice = this.#parseNumber(raw.maxPrice);
    const isNegotiable = raw.isNegotiable === 'true' ? true : raw.isNegotiable === 'false' ? false : undefined;

    let parsedAttributes: Record<string, unknown> | undefined = undefined;
    if (raw.attributes) {
      try {
        const parsed = JSON.parse(raw.attributes);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          parsedAttributes = parsed as Record<string, unknown>;
        }
      } catch (e) {
        // Ignore invalid JSON parsing or throw BadRequest?
        // It's a query parameter, so silently ignoring or throwing are both options.
        // We'll just ignore invalid formats to prevent crashing or just return empty filters.
      }
    }

    const input: DiscoverListingsInput = {
      page: this.#parsePage(raw.page),
      limit: this.#parseLimit(raw.limit),
      ...(raw.businessProfileId !== undefined && { businessProfileId: raw.businessProfileId }),
      ...(raw.currencyCode !== undefined && { currencyCode: raw.currencyCode }),
      ...(minPrice !== undefined && { minPrice }),
      ...(maxPrice !== undefined && { maxPrice }),
      ...(isNegotiable !== undefined && { isNegotiable }),
      ...(raw.search !== undefined && { search: raw.search }),
      ...(parsedAttributes !== undefined && { attributes: parsedAttributes }),
    };

    return this.repo.discover(input);
  }

  #parseNumber(raw: string | undefined): number | undefined {
    if (raw === undefined) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }

  #parsePage(raw: string | undefined): number {
    const n = Number.parseInt(raw ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_PAGE;
  }

  #parseLimit(raw: string | undefined): number {
    const n = Number.parseInt(raw ?? '', 10);
    if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
    return Math.min(n, MAX_LIMIT);
  }
}
