import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { SubmitEventDto } from './dto/submit-event.dto';
import { ConfirmSubmissionDto } from './dto/confirm-submission.dto';
import { ApiResponse } from '@common/dto/api-response.dto';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) { }

  @Post('submit')
  @HttpCode(200)
  async submit(@Body() data: SubmitEventDto) {
    try {
      const result = await this.ingestionService.submit(data);
      return ApiResponse.ok(result);
    } catch (error) {
      console.error('Controller caught error:', error);
      throw error;
    }
  }

  @Post('confirm')
  @HttpCode(200)
  async confirm(@Body() data: ConfirmSubmissionDto) {
    const result = await this.ingestionService.confirm(data);
    return ApiResponse.ok(result);
  }
}
