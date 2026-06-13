import { Injectable, NotFoundException } from '@nestjs/common';
import { IInquiryRepository } from '../../domain/ports/inquiry.repository.port.js';

@Injectable()
export class GetInquiryDetailsUseCase {
  constructor(private readonly inquiryRepo: IInquiryRepository) {}

  async execute(inquiryId: string) {
    const inquiry = await this.inquiryRepo.findById(inquiryId);
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    const messages = await this.inquiryRepo.getMessages(inquiryId);
    return { inquiry, messages };
  }
}
