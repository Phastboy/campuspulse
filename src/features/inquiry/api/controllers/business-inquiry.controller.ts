import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentIdentity, type RequestIdentity } from '@odysseon/whoami-adapter-nestjs';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case.js';
import { GetBusinessInquiriesUseCase } from '../../application/use-cases/get-inquiries.use-case.js';
import { GetInquiryDetailsUseCase } from '../../application/use-cases/get-inquiry-details.use-case.js';
import { UpdateInquiryStatusUseCase } from '../../application/use-cases/update-inquiry-status.use-case.js';
import { SendMessageDto, UpdateInquiryStatusDto } from '../dto/request.dto.js';
import { InquiryResponseDto, InquiryMessageResponseDto } from '../dto/response.dto.js';

@ApiTags('Inquiries (Business Dashboard)')
@Controller('businesses/:businessId/inquiries')
@ApiBearerAuth()
export class BusinessInquiryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getBusinessInquiriesUseCase: GetBusinessInquiriesUseCase,
    private readonly getInquiryDetailsUseCase: GetInquiryDetailsUseCase,
    private readonly updateInquiryStatusUseCase: UpdateInquiryStatusUseCase,
  ) {}

  private async resolveUserId(accountId: string) {
    const user = await this.prisma.user.findUnique({ where: { accountId } });
    if (!user) throw new Error('User not found');
    return user.id;
  }

  @Get()
  @ApiOperation({ summary: 'Get all inquiries for a business' })
  async getInquiries(
    @Param('businessId') businessId: string,
  ): Promise<InquiryResponseDto[]> {
    // Real implementation should verify ownerId
    const inquiries = await this.getBusinessInquiriesUseCase.execute(businessId);
    return inquiries.map((inq) => InquiryResponseDto.from(inq));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inquiry details' })
  async getInquiryDetails(
    @Param('id') id: string,
  ): Promise<InquiryResponseDto> {
    const { inquiry, messages } = await this.getInquiryDetailsUseCase.execute(id);
    return InquiryResponseDto.from(inquiry, messages);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Reply to a user inquiry' })
  async reply(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ): Promise<InquiryMessageResponseDto> {
    const userId = await this.resolveUserId(identity.accountId);
    const message = await this.sendMessageUseCase.execute({
      inquiryId: id,
      senderId: userId,
      content: dto.content,
    });
    
    // Automatically update status to RESPONDED if the business replies
    await this.updateInquiryStatusUseCase.execute(id, 'RESPONDED');
    
    return InquiryMessageResponseDto.from(message);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update inquiry status (e.g. mark as READ)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInquiryStatusDto,
  ): Promise<InquiryResponseDto> {
    const inquiry = await this.updateInquiryStatusUseCase.execute(id, dto.status);
    return InquiryResponseDto.from(inquiry);
  }
}
