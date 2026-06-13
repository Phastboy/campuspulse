import { Injectable, NotFoundException } from '@nestjs/common';
import { ITagRepository } from '../../domain/ports/tag.repository.port.js';
import { Tag } from '../../domain/types/tag.entity.js';

@Injectable()
export class GetTagUseCase {
  constructor(private readonly tagRepo: ITagRepository) {}

  async execute(idOrSlug: string): Promise<Tag> {
    let tag = await this.tagRepo.findById(idOrSlug);
    if (!tag) {
      tag = await this.tagRepo.findBySlug(idOrSlug);
    }

    if (!tag) {
      throw new NotFoundException(`Tag '${idOrSlug}' not found.`);
    }

    return tag;
  }
}
