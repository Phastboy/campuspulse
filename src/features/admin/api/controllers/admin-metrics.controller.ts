import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminMetricsService } from '../../application/admin-metrics.service.js';
import { AdminGuard } from '../../../../shared/decorators/admin-guard.decorator.js';

@ApiTags('Admin')
@Controller('api/admin')
export class AdminMetricsController {
  constructor(private readonly adminMetricsService: AdminMetricsService) {}

  @Get('metrics')
  @AdminGuard()
  @ApiOperation({ summary: 'Get platform-wide metrics (admin only)' })
  async getPlatformMetrics() {
    return this.adminMetricsService.getPlatformMetrics();
  }
}
