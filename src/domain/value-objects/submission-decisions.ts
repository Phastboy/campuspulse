/**
 * Valid values for the `decision` field in the ingestion confirm step.
 *
 * Declared as a `const` tuple so it serves as both the runtime array passed
 * to `@IsIn()` for validation and the source of the `SubmissionDecision`
 * union via `typeof` inference.
 */
export const SUBMISSION_DECISIONS = ['new', 'duplicate'] as const;

/** Union of valid submission decision strings: `'new' | 'duplicate'` */
export type SubmissionDecision = (typeof SUBMISSION_DECISIONS)[number];
