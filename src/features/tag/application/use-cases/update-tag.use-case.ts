import { Injectable, NotFoundException } from '@nestjs/common';
import { ITagRepository } from '../../domain/ports/tag.repository.port.js';
import { Tag } from '../../domain/types/tag.entity.js';
import { UpdateTagInput } from '../../domain/types/tag.types.js';

@Injectable()
export class UpdateTagUseCase {
  constructor(private readonly tagRepo: ITagRepository) {}

  async execute(id: string, input: UpdateTagInput): Promise<Tag> {
    const existing = await this.tagRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tag with ID '${id}' not found.`);
    }

    return this.tagRepo.update(id, { name: input.name.toLowerCase() });
  }
}
