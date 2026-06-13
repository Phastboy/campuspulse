import { StoreTour } from '../types/store-tour.entity.js';
import {
  CreateStoreTourInput,
  DiscoverStoreToursInput,
  PaginatedStoreTours,
  UpdateStoreTourInput,
  StoreTourView,
} from '../types/store-tour.types.js';

export abstract class IStoreTourRepository {
  abstract create(input: CreateStoreTourInput): Promise<StoreTour>;
  abstract findById(id: string): Promise<StoreTourView | null>;
  abstract update(id: string, input: UpdateStoreTourInput): Promise<StoreTour>;
  abstract delete(id: string): Promise<void>;
  abstract discover(input: DiscoverStoreToursInput): Promise<PaginatedStoreTours>;
}
