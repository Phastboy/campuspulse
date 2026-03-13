import { EventDateTime } from './event-datetime.interface';

/**
 * Successful result from a datetime parsing operation.
 *
 * `confidence` indicates how certain the parser is about the result —
 * useful when the input was ambiguous (e.g. "Friday" without a specific date).
 */
export type DateParseSuccess = {
  success: true;

  /** The structured datetime extracted from the input string. */
  parsed: EventDateTime;

  /**
   * Parser confidence in the range [0, 1].
   * - `1.0` — unambiguous (e.g. full ISO 8601 string)
   * - `< 1.0` — inferred from context (e.g. "next Friday")
   */
  confidence: number;

  /** The original unparsed string, preserved for debugging or display. */
  original: string;
};

/**
 * Failed result from a datetime parsing operation.
 */
export type DateParseFailure = {
  success: false;

  /** Human-readable explanation of why parsing failed. */
  error: string;

  /** The original unparsed string that was rejected. */
  original: string;
};

/**
 * Discriminated union representing the outcome of a datetime parse attempt.
 *
 * Narrow on `success` before accessing `parsed` or `error`:
 *
 * @example
 * const result: DateParseResult = parseDateTime(input);
 * if (result.success) {
 *   console.log(result.parsed, result.confidence);
 * } else {
 *   console.error(result.error);
 * }
 */
export type DateParseResult = DateParseSuccess | DateParseFailure;
