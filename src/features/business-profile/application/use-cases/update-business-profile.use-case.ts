import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IBusinessProfileRepository } from '../../domain/ports/business-profile.repository.port.js';
import {
  UpdateBusinessProfileInput,
  BusinessProfileView,
} from '../../domain/types/business-profile.types.js';

@Injectable()
export class UpdateBusinessProfileUseCase {
  constructor(private readonly repo: IBusinessProfileRepository) {}

  async execute(
    id: string,
    requesterId: string,
    input: UpdateBusinessProfileInput,
  ): Promise<BusinessProfileView> {
    const profile = await this.repo.findById(id);

    if (!profile) {
      throw new NotFoundException('Business profile not found.');
    }

    if (profile.ownerId !== requesterId) {
      throw new ForbiddenException('You do not own this business profile.');
    }

    return this.repo.update(id, input);
  }
}
