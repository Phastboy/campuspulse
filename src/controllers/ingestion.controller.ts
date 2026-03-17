import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { IngestionService } from '@services/ingestion.service';
import { SubmitEventDto } from '@dto/submit-event.dto';
import { ConfirmSubmissionDto } from '@dto/confirm-submission.dto';
import { ApiResponse as AppApiResponse } from '@dto/api-response.dto';
import { IngestionResult } from '@dto/ingestion-result.dto';

/**
 * HTTP boundary for the two-step event submission pipeline.
 * Contains no business logic — delegates entirely to {@link IngestionService}.
 */
@ApiTags('ingestion')
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('submit')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Submit a new event',
    description: 'Returns `created`, `linked`, or `needs_decision`.',
  })
  @ApiBody({ type: SubmitEventDto })
  @ApiResponse({
    status: 200,
    description: '`created` | `linked` | `needs_decision`',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async submit(
    @Body() data: SubmitEventDto,
  ): Promise<AppApiResponse<IngestionResult>> {
    return AppApiResponse.ok(await this.ingestionService.submit(data));
  }

  @Post('confirm')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Resolve a needs_decision submission',
    description:
      'Pass original submission + `decision: "new" | "duplicate"`. Returns `created` or `linked`.',
  })
  @ApiBody({ type: ConfirmSubmissionDto })
  @ApiResponse({ status: 200, description: '`created` | `linked`' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async confirm(
    @Body() data: ConfirmSubmissionDto,
  ): Promise<AppApiResponse<IngestionResult>> {
    return AppApiResponse.ok(await this.ingestionService.confirm(data));
  }
}
