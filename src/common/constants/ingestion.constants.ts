/**
 * Valid values for the `decision` field in `ConfirmSubmissionDto`.
 *
 * Declared as a `const` tuple so it serves as both:
 * - The runtime array passed to `@IsIn()` for validation
 * - The source of the `SubmissionDecision` union type via `typeof` inference
 */
export const SUBMISSION_DECISIONS = ['new', 'duplicate'] as const;

/** Union of valid submission decision strings: `'new' | 'duplicate'` */
export type SubmissionDecision = (typeof SUBMISSION_DECISIONS)[number];
