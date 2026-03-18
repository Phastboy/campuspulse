import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { IngestionService } from '@services/ingestion.service';
import { SubmitEventDto } from '@dto/submit-event.dto';
import { ConfirmSubmissionDto } from '@dto/confirm-submission.dto';
import { ApiResponse as AppApiResponse } from '@dto/api-response.dto';
import {
  IngestionResult,
  CreatedResult,
  LinkedResult,
  NeedsDecisionResult,
} from '@dto/ingestion-result.dto';
import { ScoredEvent } from '@dto/similarity.dto';
import { IngestionOutcome, SimilarityMatch } from '@application/types';

/**
 * HTTP boundary for the two-step event submission pipeline.
 *
 * Contains no business logic. Delegates to {@link IngestionService} and maps
 * the domain-level {@link IngestionOutcome} to the appropriate HTTP DTO
 * ({@link IngestionResult}) before returning. The Swagger-decorated
 * {@link ScoredEvent} is constructed here — it never enters the service layer.
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
    const outcome = await this.ingestionService.submit(data);
    return AppApiResponse.ok(toIngestionResult(outcome));
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
    const outcome = await this.ingestionService.confirm(data);
    return AppApiResponse.ok(toIngestionResult(outcome));
  }
}

// ── Domain → HTTP mapping ────────────────────────────────────────────────────

function toIngestionResult(outcome: IngestionOutcome): IngestionResult {
  switch (outcome.action) {
    case 'created':
      return Object.assign(new CreatedResult(), outcome);
    case 'linked':
      return Object.assign(new LinkedResult(), outcome);
    case 'needs_decision':
      return Object.assign(new NeedsDecisionResult(), {
        ...outcome,
        similar: outcome.similar.map(toScoredEvent),
      });
  }
}

function toScoredEvent(match: SimilarityMatch): ScoredEvent {
  return Object.assign(new ScoredEvent(), match);
}
