import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { IReviewRepository } from '../../domain/ports/review.repository.port.js';
import { Review } from '../../domain/types/review.entity.js';
import { CreateReviewInput } from '../../domain/types/review.types.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Prisma } from '../../../../../generated/prisma/client.js';

@Injectable()
export class CreateReviewUseCase {
  constructor(
    private readonly reviewRepo: IReviewRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: CreateReviewInput): Promise<Review> {
    // 1. Validate rating range
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('Rating must be an integer between 1 and 5.');
    }

    // 2. Ensure the listing exists
    const listing = await this.prisma.listing.findUnique({
      where: { id: input.listingId },
      select: { id: true },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }

    // 3. Enforce one-review-per-listing-per-user
    const alreadyReviewed = await this.reviewRepo.existsByListingAndReviewer(
      input.listingId,
      input.reviewerId,
    );
    if (alreadyReviewed) {
      throw new ConflictException('You have already submitted a review for this listing.');
    }

    try {
      return await this.reviewRepo.create(input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already submitted a review for this listing.');
      }
      throw error;
    }
  }
}
