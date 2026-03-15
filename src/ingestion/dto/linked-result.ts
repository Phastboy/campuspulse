/**
 * Result returned when the submission is linked to an existing event.
 *
 * Occurs when:
 * - An exact match (score 1.0) was found during initial submission
 * - The submitter confirmed `decision: "duplicate"`
 * - The submitter chose `"new"` but an exact match was found anyway (trust model)
 */
export class LinkedResult {
  readonly action!: 'linked';
  message!: string;
  eventId!: string;
}
