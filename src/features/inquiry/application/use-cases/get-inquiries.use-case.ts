import { Injectable } from '@nestjs/common';
import { IInquiryRepository } from '../../domain/ports/inquiry.repository.port.js';

@Injectable()
export class GetBusinessInquiriesUseCase {
  constructor(private readonly inquiryRepo: IInquiryRepository) {}

  async execute(businessProfileId: string) {
    return this.inquiryRepo.findByBusinessProfile(businessProfileId);
  }
}

@Injectable()
export class GetUserInquiriesUseCase {
  constructor(private readonly inquiryRepo: IInquiryRepository) {}

  async execute(userId: string) {
    return this.inquiryRepo.findByUser(userId);
  }
}
