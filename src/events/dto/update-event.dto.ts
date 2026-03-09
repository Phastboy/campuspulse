import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateEventDto } from './create-event.dto';
import type { EventStatus } from '../entities/event.entity';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({
    enum: ['pending', 'live', 'cancelled', 'postponed'],
    description: 'Event status',
  })
  @IsEnum(['pending', 'live', 'cancelled', 'postponed'])
  @IsOptional()
  status?: EventStatus;
}
