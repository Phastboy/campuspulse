import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { IBusinessProfileRepository } from '../../domain/ports/business-profile.repository.port.js';
import { SetOperatingHoursInput } from '../../domain/types/operating-hours.types.js';

@Injectable()
export class SetOperatingHoursUseCase {
  constructor(private readonly businessRepo: IBusinessProfileRepository) {}

  /**
   * Validates time format HH:mm and replaces operating hours for a business profile.
   * Only the business owner or an admin can update the hours.
   */
  async execute(
    businessId: string,
    hours: SetOperatingHoursInput[],
    requesterId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const business = await this.businessRepo.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business profile not found.');
    }

    if (business.ownerId !== requesterId && !isAdmin) {
      throw new ForbiddenException('Only the business owner can manage operating hours.');
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    for (const item of hours) {
      if (!timeRegex.test(item.openTime)) {
        throw new BadRequestException(`Invalid openTime format for ${item.day}: must be HH:mm`);
      }
      if (!timeRegex.test(item.closeTime)) {
        throw new BadRequestException(`Invalid closeTime format for ${item.day}: must be HH:mm`);
      }
    }

    // Enforce uniqueness constraint at the use case level to give better errors
    const daysSeen = new Set<string>();
    for (const item of hours) {
      if (daysSeen.has(item.day)) {
        throw new BadRequestException(
          `Duplicate entry for day: ${item.day}. Provide at most one entry per day.`,
        );
      }
      daysSeen.add(item.day);
    }

    await this.businessRepo.setOperatingHours(businessId, hours);
  }
}
