import { Injectable, NotFoundException } from '@nestjs/common';
import { ITagRepository } from '../../domain/ports/tag.repository.port.js';
import { Tag } from '../../domain/types/tag.entity.js';

@Injectable()
export class GetTagUseCase {
  constructor(private readonly tagRepo: ITagRepository) {}

  async execute(idOrSlug: string): Promise<Tag> {
    // Basic heuristic to distinguish UUID vs slug
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrSlug);
    
    const tag = isUuid 
      ? await this.tagRepo.findById(idOrSlug)
      : await this.tagRepo.findBySlug(idOrSlug);

    if (!tag) {
      throw new NotFoundException(`Tag '${idOrSlug}' not found.`);
    }

    return tag;
  }
}
