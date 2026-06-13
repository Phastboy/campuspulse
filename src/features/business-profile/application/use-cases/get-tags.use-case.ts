import { Injectable } from '@nestjs/common';
import { ITagRepository } from '../../domain/ports/tag.repository.port.js';
import { Tag } from '../../domain/types/tag.types.js';

@Injectable()
export class GetTagsUseCase {
  constructor(private readonly tagRepo: ITagRepository) {}

  /**
   * Fetches all available global tags.
   */
  async execute(): Promise<Tag[]> {
    return this.tagRepo.findAll();
  }
}
