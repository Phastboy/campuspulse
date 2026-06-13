import { Injectable } from '@nestjs/common';
import { IInquiryRepository } from '../domain/ports/inquiry.repository.port.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { InquiryView, InquiryMessageView, CreateInquiryInput, SendMessageInput, InquiryStatus } from '../domain/types/inquiry.types.js';

@Injectable()
export class PrismaInquiryRepository implements IInquiryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateInquiryInput): Promise<InquiryView> {
    const inquiry = await this.prisma.inquiry.create({
      data: {
        businessProfileId: input.businessProfileId,
        userId: input.userId,
        listingId: input.listingId ?? null,
        subject: input.subject ?? null,
        messages: {
          create: {
            senderId: input.userId,
            content: input.initialMessage,
          },
        },
      },
    });

    return inquiry as InquiryView;
  }

  async addMessage(input: SendMessageInput): Promise<InquiryMessageView> {
    const message = await this.prisma.inquiryMessage.create({
      data: {
        inquiryId: input.inquiryId,
        senderId: input.senderId,
        content: input.content,
      },
    });

    // Update the inquiry updatedAt timestamp and change status to UNREAD if the sender is not the business owner.
    // Wait, let's just update updatedAt for now.
    await this.prisma.inquiry.update({
      where: { id: input.inquiryId },
      data: { updatedAt: new Date() },
    });

    return message as InquiryMessageView;
  }

  async findById(id: string): Promise<InquiryView | null> {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
    });
    return inquiry as InquiryView | null;
  }

  async findByBusinessProfile(businessProfileId: string): Promise<InquiryView[]> {
    const inquiries = await this.prisma.inquiry.findMany({
      where: { businessProfileId },
      orderBy: { updatedAt: 'desc' },
    });
    return inquiries as InquiryView[];
  }

  async findByUser(userId: string): Promise<InquiryView[]> {
    const inquiries = await this.prisma.inquiry.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return inquiries as InquiryView[];
  }

  async getMessages(inquiryId: string): Promise<InquiryMessageView[]> {
    const messages = await this.prisma.inquiryMessage.findMany({
      where: { inquiryId },
      orderBy: { createdAt: 'asc' },
    });
    return messages as InquiryMessageView[];
  }

  async updateStatus(id: string, status: InquiryStatus): Promise<InquiryView> {
    const inquiry = await this.prisma.inquiry.update({
      where: { id },
      data: { status },
    });
    return inquiry as InquiryView;
  }
}
