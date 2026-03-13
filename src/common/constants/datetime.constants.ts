/**
 * Valid values for the event datetime `type` discriminator.
 *
 * Declared as a `const` tuple so it serves as both:
 * - The runtime array passed to `@IsIn()` for validation
 * - The source of the `DatetimeType` union type via `typeof` inference
 *
 * Add new datetime shapes here — validators and types update automatically.
 */
export const DATETIME_TYPES = ['specific', 'all-day'] as const;

/** Union of valid datetime type strings: `'specific' | 'all-day'` */
export type DatetimeType = (typeof DATETIME_TYPES)[number];
