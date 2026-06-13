import { Injectable, NotFoundException } from '@nestjs/common';
import { IStoreTourRepository } from '../../domain/ports/store-tour.repository.port.js';
import { StoreTourView } from '../../domain/types/store-tour.types.js';

@Injectable()
export class GetStoreTourUseCase {
  constructor(private readonly storeTourRepo: IStoreTourRepository) {}

  async execute(id: string): Promise<StoreTourView> {
    const tour = await this.storeTourRepo.findById(id);
    if (!tour) {
      throw new NotFoundException('Store tour not found.');
    }
    return tour;
  }
}
