import { Injectable } from '@nestjs/common';
import { IInquiryRepository } from '../../domain/ports/inquiry.repository.port.js';
import { SendMessageInput } from '../../domain/types/inquiry.types.js';

@Injectable()
export class SendMessageUseCase {
  constructor(private readonly inquiryRepo: IInquiryRepository) {}

  async execute(input: SendMessageInput) {
    return this.inquiryRepo.addMessage(input);
  }
}
