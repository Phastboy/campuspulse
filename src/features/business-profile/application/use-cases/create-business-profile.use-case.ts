import { Injectable, ConflictException } from '@nestjs/common';
import slugify from 'slugify';
import { IBusinessProfileRepository } from '../../domain/ports/business-profile.repository.port.js';
import {
  CreateBusinessProfileInput,
  BusinessProfileView,
} from '../../domain/types/business-profile.types.js';

@Injectable()
export class CreateBusinessProfileUseCase {
  constructor(private readonly repo: IBusinessProfileRepository) {}

  async execute(input: CreateBusinessProfileInput): Promise<BusinessProfileView> {
    const slug = await this.deriveUniqueSlug(input.name);

    return this.repo.create(input, slug);
  }

  private async deriveUniqueSlug(name: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true });

    if (!(await this.repo.isSlugTaken(base))) {
      return base;
    }

    // Append random suffix until unique
    for (let i = 0; i < 5; i++) {
      const candidate = `${base}-${Math.random().toString(36).slice(2, 7)}`;
      if (!(await this.repo.isSlugTaken(candidate))) {
        return candidate;
      }
    }

    throw new ConflictException('Could not generate a unique slug. Please try a different name.');
  }
}
