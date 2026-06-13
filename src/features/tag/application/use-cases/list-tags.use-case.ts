import { Injectable } from '@nestjs/common';
import { ITagRepository } from '../../domain/ports/tag.repository.port.js';
import { PaginatedTags } from '../../domain/types/tag.types.js';

@Injectable()
export class ListTagsUseCase {
  constructor(private readonly tagRepo: ITagRepository) {}

  async execute(page: number, limit: number, search?: string): Promise<PaginatedTags> {
    return this.tagRepo.list(page, limit, search);
  }
}
