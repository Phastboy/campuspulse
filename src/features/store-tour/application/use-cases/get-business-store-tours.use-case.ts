import { Injectable } from '@nestjs/common';
import { IStoreTourRepository } from '../../domain/ports/store-tour.repository.port.js';
import {
  DiscoverStoreToursInput,
  PaginatedStoreTours,
} from '../../domain/types/store-tour.types.js';

@Injectable()
export class GetBusinessStoreToursUseCase {
  constructor(private readonly storeTourRepo: IStoreTourRepository) {}

  async execute(input: DiscoverStoreToursInput): Promise<PaginatedStoreTours> {
    return this.storeTourRepo.discover(input);
  }
}
