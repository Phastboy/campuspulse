import { Injectable } from '@nestjs/common';
import { IInquiryRepository } from '../../domain/ports/inquiry.repository.port.js';
import { InquiryStatus } from '../../domain/types/inquiry.types.js';

@Injectable()
export class UpdateInquiryStatusUseCase {
  constructor(private readonly inquiryRepo: IInquiryRepository) {}

  async execute(inquiryId: string, status: InquiryStatus) {
    return this.inquiryRepo.updateStatus(inquiryId, status);
  }
}
