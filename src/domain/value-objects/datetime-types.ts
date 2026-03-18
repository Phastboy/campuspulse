/**
 * Valid values for the event datetime `type` discriminator.
 *
 * Declared as a `const` tuple so it serves as both the runtime array passed
 * to `@IsIn()` for validation and the source of the `DatetimeType` union
 * via `typeof` inference.
 */
export const DATETIME_TYPES = ['specific', 'all-day'] as const;

/** Union of valid datetime type strings: `'specific' | 'all-day'` */
export type DatetimeType = (typeof DATETIME_TYPES)[number];
