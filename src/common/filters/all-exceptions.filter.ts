import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter — normalises all thrown errors into a consistent
 * JSON envelope so clients always receive a predictable error shape.
 *
 * Handles two categories:
 * - **`HttpException`** (and subclasses like `NotFoundException`,
 *   `BadRequestException`) — the HTTP status and response body are taken
 *   directly from the exception.
 * - **Everything else** — treated as an unexpected server error and returned
 *   as HTTP 500 with a generic message. The original error is not leaked to
 *   the client.
 *
 * Response shape:
 * ```json
 * {
 *   "statusCode": 404,
 *   "timestamp": "2026-02-28T10:00:00.000Z",
 *   "path": "/api/events/unknown-id",
 *   "message": { "message": "Event with ID unknown-id not found", "error": "Not Found", "statusCode": 404 }
 * }
 * ```
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  /**
   * Intercepts all unhandled exceptions and writes a normalised JSON response.
   *
   * @param exception - The thrown value (may be any type)
   * @param host - NestJS arguments host used to access the HTTP context
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
