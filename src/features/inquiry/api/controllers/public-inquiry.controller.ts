import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentIdentity, type RequestIdentity } from '@odysseon/whoami-adapter-nestjs';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateInquiryUseCase } from '../../application/use-cases/create-inquiry.use-case.js';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case.js';
import { GetUserInquiriesUseCase } from '../../application/use-cases/get-inquiries.use-case.js';
import { GetInquiryDetailsUseCase } from '../../application/use-cases/get-inquiry-details.use-case.js';
import { CreateInquiryDto, SendMessageDto } from '../dto/request.dto.js';
import { InquiryResponseDto, InquiryMessageResponseDto } from '../dto/response.dto.js';

@ApiTags('Inquiries (Public)')
@Controller('users/me/inquiries')
@ApiBearerAuth()
export class PublicInquiryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createInquiryUseCase: CreateInquiryUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getUserInquiriesUseCase: GetUserInquiriesUseCase,
    private readonly getInquiryDetailsUseCase: GetInquiryDetailsUseCase,
  ) {}

  private async resolveUserId(accountId: string) {
    const user = await this.prisma.user.findUnique({ where: { accountId } });
    if (!user) throw new Error('User not found');
    return user.id;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new inquiry (send message to business)' })
  async createInquiry(
    @CurrentIdentity() identity: RequestIdentity,
    @Body() dto: CreateInquiryDto,
  ): Promise<InquiryResponseDto> {
    const userId = await this.resolveUserId(identity.accountId);
    const inquiry = await this.createInquiryUseCase.execute({
      ...dto,
      userId,
    });
    return InquiryResponseDto.from(inquiry);
  }

  @Get()
  @ApiOperation({ summary: 'Get my inquiries' })
  async getMyInquiries(@CurrentIdentity() identity: RequestIdentity): Promise<InquiryResponseDto[]> {
    const userId = await this.resolveUserId(identity.accountId);
    const inquiries = await this.getUserInquiriesUseCase.execute(userId);
    return inquiries.map((inq) => InquiryResponseDto.from(inq));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inquiry details and messages' })
  async getInquiryDetails(
    @Param('id') id: string,
  ): Promise<InquiryResponseDto> {
    const { inquiry, messages } = await this.getInquiryDetailsUseCase.execute(id);
    return InquiryResponseDto.from(inquiry, messages);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Reply to an inquiry' })
  async replyToInquiry(
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
    return InquiryMessageResponseDto.from(message);
  }
}
