import { Injectable, NotFoundException } from '@nestjs/common';
import { ITagRepository } from '../../domain/ports/tag.repository.port.js';

@Injectable()
export class DeleteTagUseCase {
  constructor(private readonly tagRepo: ITagRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.tagRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tag with ID '${id}' not found.`);
    }

    await this.tagRepo.delete(id);
  }
}
