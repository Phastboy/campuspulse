import { Injectable } from '@nestjs/common';
import { IMediaRepository, MediaOwnerKey } from '../../domain/ports/media.repository.port.js';
import { Media } from '../../domain/types/media.entity.js';

@Injectable()
export class GetResourceMediaUseCase {
  constructor(private readonly mediaRepo: IMediaRepository) {}

  async execute(ownerKey: MediaOwnerKey, ownerId: string): Promise<Media[]> {
    return this.mediaRepo.findByOwner(ownerKey, ownerId);
  }
}
