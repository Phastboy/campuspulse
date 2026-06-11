import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { RedisService } from '../../../../shared/redis/redis.service.js';
import { MailQueueService } from '../../../../mail/mail-queue.service.js';
import * as crypto from 'crypto';

@Injectable()
export class RequestDraftVerificationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly mailQueueService: MailQueueService,
  ) {}

  async execute(draftId: string, ownerId: string) {
    const draft = await this.prisma.businessProfileDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      throw new NotFoundException('Business draft not found.');
    }

    if (draft.ownerId !== ownerId) {
      throw new NotFoundException('Business draft not found.'); // Hide existence
    }

    const draftData = draft.data as Record<string, any>;
    const email = draftData.email;

    if (!email || typeof email !== 'string') {
      throw new BadRequestException('An email address must be provided in the draft data to request verification.');
    }

    // Generate a secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store in Redis with 15 minutes TTL
    const redisClient = this.redisService.getClient();
    const redisKey = `business_verification:${draftId}`;
    await redisClient.set(redisKey, otp, 'EX', 15 * 60);

    // Enqueue the email
    await this.mailQueueService.enqueueMail({
      to: email,
      subject: 'Verify your business email for Pulse',
      template: 'business-verification',
      context: {
        otp,
      },
    });

    return { message: 'Verification code sent to email.' };
  }
}
