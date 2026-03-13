/**
 * Shape of a structured API error returned inside {@link ApiResponse}.
 */
export interface ApiError {
  /** Machine-readable error code (e.g. `"VALIDATION_FAILED"`, `"NOT_FOUND"`). */
  code: string;

  /** Human-readable description of what went wrong. */
  message: string;

  /** Optional additional context — validation errors, field names, etc. */
  details?: unknown;
}

/**
 * Typed wrapper for all API responses.
 *
 * Every endpoint in CampusPulse wraps its return value in this envelope so
 * clients always receive a consistent shape, regardless of whether the call
 * succeeded or failed.
 *
 * Success shape:
 * ```json
 * { "success": true, "data": { ... }, "timestamp": "2026-02-28T10:00:00.000Z" }
 * ```
 *
 * Failure shape:
 * ```json
 * { "success": false, "error": { "code": "NOT_FOUND", "message": "..." }, "timestamp": "..." }
 * ```
 *
 * Use the static factory methods {@link ok} and {@link fail} to construct
 * instances — the constructor is private to prevent incomplete objects.
 *
 * @typeParam T - The type of the `data` payload on success responses
 */
export class ApiResponse<T> {
  /** `true` for successful responses; `false` for errors. */
  readonly success: boolean;

  /** Response payload. Present only when `success` is `true`. */
  readonly data?: T;

  /** Error details. Present only when `success` is `false`. */
  readonly error?: ApiError;

  /** ISO 8601 timestamp of when the response was generated. */
  readonly timestamp: string;

  private constructor(success: boolean, data?: T, error?: ApiError) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Creates a successful response wrapping the given data payload.
   *
   * @param data - The response payload
   * @returns A successful `ApiResponse<T>` with `success: true`
   *
   * @example
   * return ApiResponse.ok(event);
   * // { success: true, data: { id: "...", title: "..." }, timestamp: "..." }
   */
  static ok<T>(data: T): ApiResponse<T> {
    return new ApiResponse<T>(true, data);
  }

  /**
   * Creates a failure response with a structured error.
   *
   * @param code - Machine-readable error code
   * @param message - Human-readable error description
   * @param details - Optional additional context
   * @returns A failed `ApiResponse<null>` with `success: false`
   *
   * @example
   * return ApiResponse.fail('NOT_FOUND', 'Event not found', { id });
   * // { success: false, error: { code: "NOT_FOUND", message: "..." }, timestamp: "..." }
   */
  static fail(
    code: string,
    message: string,
    details?: unknown,
  ): ApiResponse<null> {
    return new ApiResponse<null>(false, undefined, { code, message, details });
  }
}
