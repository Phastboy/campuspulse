import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, ValidateIf, IsUUID } from 'class-validator';
import { SubmitEventDto } from './submit-event.dto';
import {
  SUBMISSION_DECISIONS,
  type SubmissionDecision,
} from '@common/constants';

/**
 * Payload for resolving a `needs_decision` submission.
 *
 * When `POST /api/ingestion/submit` returns `action: "needs_decision"`, the
 * client must call `POST /api/ingestion/confirm` with this DTO to resolve the
 * ambiguity. The `originalSubmission` from the submit response should be
 * spread into this payload.
 *
 * **Trust model:** even if `decision` is `"new"`, the engine re-checks for an
 * exact match and will auto-link if one exists — the submitter cannot force
 * a duplicate into the system.
 *
 * @example
 * // Submitter confirms it is the same event
 * {
 *   "decision": "duplicate",
 *   "existingEventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
 *   "title": "NACOS Freshers Night 2026",
 *   "type": "specific",
 *   "date": "2026-02-28",
 *   "startTime": "2026-02-28T19:00:00.000Z",
 *   "venue": "Trust Hall"
 * }
 *
 * @example
 * // Submitter says it is a new event
 * {
 *   "decision": "new",
 *   "title": "NACOS Freshers Night 2026 (After-party)",
 *   "type": "specific",
 *   "date": "2026-02-28",
 *   "startTime": "2026-02-28T23:00:00.000Z",
 *   "venue": "Trust Hall"
 * }
 */
export class ConfirmSubmissionDto extends SubmitEventDto {
  /**
   * The submitter's resolution:
   * - `duplicate` — this is the same event as `existingEventId`; link to it
   * - `new` — this is a genuinely different event; create it
   *
   * Note: `"new"` is not unconditionally trusted. If an exact match exists
   * (score 1.0), the engine overrides this decision and links anyway.
   */
  @ApiProperty({
    enum: SUBMISSION_DECISIONS,
    description:
      'Resolution decision. `"new"` is overridden if an exact match is found regardless.',
    example: 'duplicate',
  })
  @IsIn(SUBMISSION_DECISIONS)
  decision!: SubmissionDecision;

  /**
   * UUID of the existing event this submission is a duplicate of.
   * Required when `decision` is `"duplicate"`.
   *
   * Pass the `event.id` from the `similar` array returned by the submit response.
   */
  @ApiPropertyOptional({
    description:
      'UUID of the existing event. Required when decision is `"duplicate"`.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ValidateIf((o: ConfirmSubmissionDto) => o.decision === 'duplicate')
  @IsUUID()
  existingEventId?: string;
}
