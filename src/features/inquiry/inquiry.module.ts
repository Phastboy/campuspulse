import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { IInquiryRepository } from './domain/ports/inquiry.repository.port.js';
import { PrismaInquiryRepository } from './infrastructure/prisma-inquiry.repository.js';
import { CreateInquiryUseCase } from './application/use-cases/create-inquiry.use-case.js';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case.js';
import { GetBusinessInquiriesUseCase, GetUserInquiriesUseCase } from './application/use-cases/get-inquiries.use-case.js';
import { GetInquiryDetailsUseCase } from './application/use-cases/get-inquiry-details.use-case.js';
import { UpdateInquiryStatusUseCase } from './application/use-cases/update-inquiry-status.use-case.js';
import { PublicInquiryController } from './api/controllers/public-inquiry.controller.js';
import { BusinessInquiryController } from './api/controllers/business-inquiry.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [PublicInquiryController, BusinessInquiryController],
  providers: [
    {
      provide: IInquiryRepository,
      useClass: PrismaInquiryRepository,
    },
    CreateInquiryUseCase,
    SendMessageUseCase,
    GetBusinessInquiriesUseCase,
    GetUserInquiriesUseCase,
    GetInquiryDetailsUseCase,
    UpdateInquiryStatusUseCase,
  ],
  exports: [IInquiryRepository],
})
export class InquiryModule {}
