import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Root controller.
 *
 * Exposes a health-check endpoint at the API root so load balancers and
 * uptime monitors can confirm the service is running without hitting a
 * feature endpoint.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check — returns a plain string confirming the service is up.
   *
   * @returns Static greeting string from {@link AppService.getHello}
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
