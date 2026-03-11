export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly timestamp: string;

  private constructor(success: boolean, data?: T, error?: ApiError) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static ok<T>(data: T): ApiResponse<T> {
    return new ApiResponse<T>(true, data);
  }

  static fail(
    code: string,
    message: string,
    details?: unknown,
  ): ApiResponse<null> {
    return new ApiResponse<null>(false, undefined, {
      code,
      message,
      details,
    });
  }
}
