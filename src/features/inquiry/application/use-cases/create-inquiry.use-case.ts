import { Injectable } from '@nestjs/common';
import { IInquiryRepository } from '../../domain/ports/inquiry.repository.port.js';
import { CreateInquiryInput } from '../../domain/types/inquiry.types.js';

@Injectable()
export class CreateInquiryUseCase {
  constructor(private readonly inquiryRepo: IInquiryRepository) {}

  async execute(input: CreateInquiryInput) {
    return this.inquiryRepo.create(input);
  }
}
