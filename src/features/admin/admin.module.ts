import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AdminMetricsController } from './api/controllers/admin-metrics.controller.js';
import { AdminMetricsService } from './application/admin-metrics.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [AdminMetricsController],
  providers: [AdminMetricsService],
})
export class AdminModule {}
