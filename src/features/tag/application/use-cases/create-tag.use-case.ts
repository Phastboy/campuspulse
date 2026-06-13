import { ConflictException, Injectable } from '@nestjs/common';
import slugify from 'slugify';
import { ITagRepository } from '../../domain/ports/tag.repository.port.js';
import { Tag } from '../../domain/types/tag.entity.js';
import { CreateTagInput } from '../../domain/types/tag.types.js';

@Injectable()
export class CreateTagUseCase {
  constructor(private readonly tagRepo: ITagRepository) {}

  async execute(input: CreateTagInput): Promise<Tag> {
    const slug = input.slug ?? slugify(input.name, { lower: true, strict: true, trim: true });

    const isTaken = await this.tagRepo.isSlugTaken(slug);
    if (isTaken) {
      throw new ConflictException(`Tag with slug '${slug}' already exists.`);
    }

    return this.tagRepo.create({ ...input, name: input.name.toLowerCase() }, slug);
  }
}
