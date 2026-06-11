import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { RedisService } from '../../../../shared/redis/redis.service.js';
import { MailQueueService } from '../../../../mail/mail-queue.service.js';
import { CreateBusinessProfileUseCase } from './create-business-profile.use-case.js';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBusinessProfileDto } from '../../api/dto/request.dto.js';

@Injectable()
export class VerifyDraftAndPublishUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly createBusinessProfile: CreateBusinessProfileUseCase,
    private readonly mailQueueService: MailQueueService,
    private readonly configService: ConfigService,
  ) {}

  async execute(draftId: string, ownerId: string, otp: string) {
    const draft = await this.prisma.businessProfileDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft || draft.ownerId !== ownerId) {
      throw new NotFoundException('Business draft not found.');
    }

    // Verify OTP
    const redisClient = this.redisService.getClient();
    const redisKey = `business_verification:${draftId}`;
    const storedOtp = await redisClient.get(redisKey);

    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    // Validate draft data against CreateBusinessProfileDto
    const draftData = draft.data as Record<string, any>;
    const dto = plainToInstance(CreateBusinessProfileDto, draftData) as CreateBusinessProfileDto;
    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new BadRequestException('Draft data is incomplete or invalid and cannot be published.');
    }

    // Create the business profile using the existing use case
    const profile = await this.createBusinessProfile.execute({
      ...dto,
      ownerId,
    });

    // Update the profile to mark email as verified (since it was just verified)
    await this.prisma.businessProfile.update({
      where: { id: profile.id },
      data: { isEmailVerified: true },
    });

    // Delete the draft
    await this.prisma.businessProfileDraft.delete({
      where: { id: draftId },
    });
    
    // Clear OTP
    await redisClient.del(redisKey);

    // Get frontend URL configuration
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://pulse.app').replace(/\/$/, '');

    // Send "Next Steps" email urging them to list offers
    await this.mailQueueService.enqueueMail({
      to: profile.email,
      subject: 'Your Business Profile is Live on Pulse!',
      template: 'business-published',
      context: {
        businessName: profile.name,
        storefront_url: `${frontendUrl}/b/${profile.slug}`,
        action_url: `${frontendUrl}/dashboard/listings/new`,
      },
    });

    return profile;
  }
}
