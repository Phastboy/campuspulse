import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { SubmitEventDto } from './dto/submit-event.dto';
import { ConfirmSubmissionDto } from './dto/confirm-submission.dto';
import { ApiResponse as AppApiResponse } from '@common/dto/api-response.dto';
import { IngestionResult } from './dto/ingestion-result.dto';

/**
 * Handles the two-step event submission pipeline.
 *
 * **Step 1** — `POST /api/ingestion/submit`
 * Submit a new event. The pipeline scores it against existing events and
 * returns one of three outcomes:
 * - `created` — event was new, now published
 * - `linked` — exact duplicate found, linked to existing event
 * - `needs_decision` — similar events found, submitter must resolve
 *
 * **Step 2** — `POST /api/ingestion/confirm`
 * Only called when step 1 returned `needs_decision`. The submitter provides
 * a `decision` field alongside the original submission payload and receives
 * either `created` or `linked`.
 *
 * @see {@link SubmitEventDto} for the submission payload shape
 * @see {@link ConfirmSubmissionDto} for the confirm payload shape
 * @see {@link IngestionResult} for all possible response shapes
 */
@ApiTags('ingestion')
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  /**
   * Submit a new event to the ingestion pipeline.
   *
   * The pipeline normalises the submission, scores it against existing events
   * in a ±7 day window, and returns one of three outcomes. Always returns
   * HTTP 200 — the `action` field in the response body discriminates the result.
   *
   * @param data - The event submission payload
   * @returns Wrapped {@link IngestionResult} with `action: "created" | "linked" | "needs_decision"`
   *
   * @example
   * // Timed event — no duplicates
   * POST /api/ingestion/submit
   * {
   *   "title": "NACOS Parliamentary Summit 2026",
   *   "type": "specific",
   *   "date": "2026-02-28",
   *   "startTime": "2026-02-28T10:00:00.000Z",
   *   "venue": "ACE Conference Hall, ICT"
   * }
   * // → { "success": true, "data": { "action": "created", "eventId": "...", "message": "Event published successfully" } }
   */
  @Post('submit')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Submit a new event',
    description:
      'Scores the submission against existing events. Returns `created`, `linked`, or `needs_decision`.',
  })
  @ApiBody({ type: SubmitEventDto })
  @ApiResponse({
    status: 200,
    description:
      '`created` — published | `linked` — duplicate found | `needs_decision` — similar events, awaiting confirmation',
  })
  @ApiResponse({ status: 400, description: 'Validation error in payload' })
  async submit(
    @Body() data: SubmitEventDto,
  ): Promise<AppApiResponse<IngestionResult>> {
    const result = await this.ingestionService.submit(data);
    return AppApiResponse.ok(result);
  }

  /**
   * Resolve a `needs_decision` submission.
   *
   * Called only after `POST /submit` returns `action: "needs_decision"`.
   * Pass the `originalSubmission` from the submit response alongside a
   * `decision` field. Always returns HTTP 200.
   *
   * **Trust model:** even when `decision` is `"new"`, the engine re-checks
   * for an exact match. If one exists, the submission is linked regardless.
   *
   * @param data - The confirm payload (original submission + `decision` field)
   * @returns Wrapped {@link IngestionResult} with `action: "created" | "linked"`
   *
   * @example
   * // Submitter says it's a duplicate
   * POST /api/ingestion/confirm
   * {
   *   "decision": "duplicate",
   *   "existingEventId": "a1b2c3d4-...",
   *   "title": "NACOS Freshers Night 2026",
   *   "type": "specific",
   *   "date": "2026-02-28",
   *   "startTime": "2026-02-28T19:00:00.000Z",
   *   "venue": "Trust Hall"
   * }
   * // → { "success": true, "data": { "action": "linked", "eventId": "a1b2c3d4-..." } }
   */
  @Post('confirm')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Resolve a needs_decision submission',
    description:
      'Pass the original submission payload plus `decision: "new" | "duplicate"`. Returns `created` or `linked`.',
  })
  @ApiBody({ type: ConfirmSubmissionDto })
  @ApiResponse({
    status: 200,
    description:
      '`created` — published as new | `linked` — linked to existing event',
  })
  @ApiResponse({ status: 400, description: 'Validation error in payload' })
  async confirm(
    @Body() data: ConfirmSubmissionDto,
  ): Promise<AppApiResponse<IngestionResult>> {
    const result = await this.ingestionService.confirm(data);
    return AppApiResponse.ok(result);
  }
}
