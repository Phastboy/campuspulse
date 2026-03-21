import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventsWriteService } from '@services/events/events-write.service';
import { UpdateEventDto } from '@dto/update-event.dto';
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
import { CurrentUser, type RequestUser } from '@odysseon/auth';

@ApiTags('events')
@Controller('events')
export class EventsWriteController {
  constructor(private readonly eventsWriteService: EventsWriteService) {}

  // ── Ingestion ────────────────────────────────────────────────────────────

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
  @ApiBearerAuth()
  async submit(
    @Body() data: SubmitEventDto,
    @CurrentUser() user: RequestUser,
  ): Promise<AppApiResponse<IngestionResult>> {
    const outcome = await this.eventsWriteService.submit(
      data,
      user?.userId ?? null,
    );
    return AppApiResponse.ok(toIngestionResult(outcome));
  }

  @Post('confirm')
  @HttpCode(200)
  @ApiOperation({ summary: 'Resolve a needs_decision submission' })
  @ApiBody({ type: ConfirmSubmissionDto })
  @ApiResponse({ status: 200, description: '`created` | `linked`' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiBearerAuth()
  async confirm(
    @Body() data: ConfirmSubmissionDto,
    @CurrentUser() user: RequestUser,
  ): Promise<AppApiResponse<IngestionResult>> {
    const outcome = await this.eventsWriteService.confirm(
      data,
      user?.userId ?? null,
    );
    return AppApiResponse.ok(toIngestionResult(outcome));
  }

  // ── Direct mutations ─────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an event',
    description: 'Partial update — only provided fields are changed.',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 400 })
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateEventDto,
  ): Promise<AppApiResponse<unknown>> {
    try {
      return AppApiResponse.ok(
        await this.eventsWriteService.update(id, updateData),
      );
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event', description: 'Hard delete.' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404 })
  delete(@Param('id') id: string): Promise<void> {
    return this.eventsWriteService.delete(id);
  }
}

function toIngestionResult(outcome: IngestionOutcome): IngestionResult {
  switch (outcome.action) {
    case 'created':
      return Object.assign(new CreatedResult(), outcome);
    case 'linked':
      return Object.assign(new LinkedResult(), outcome);
    case 'needs_decision':
      return Object.assign(new NeedsDecisionResult(), {
        ...outcome,
        similar: outcome.similar.map((m: SimilarityMatch) =>
          Object.assign(new ScoredEvent(), m),
        ),
      });
  }
}
