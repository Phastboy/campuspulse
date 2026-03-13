import { Injectable } from '@nestjs/common';

/**
 * Root application service.
 *
 * Provides the response for the health-check endpoint exposed by
 * {@link AppController}. Extend this service to add application-level
 * logic that does not belong to a specific feature module.
 */
@Injectable()
export class AppService {
  /**
   * Returns a static string confirming the service is running.
   * Used by the health-check endpoint.
   */
  getHello(): string {
    return 'CampusPulse API is running.';
  }
}
