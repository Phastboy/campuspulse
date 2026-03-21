import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '@odysseon/auth';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EventsReadService } from '@services/events/events-read.service';
import { EventQueryDto } from '@dto/event-query.dto';
import { ApiResponse as AppApiResponse } from '@dto/api-response.dto';
import { DATETIME_TYPES } from '@domain/value-objects';

@Public()
@ApiTags('events')
@Controller('events')
export class EventsReadController {
  constructor(private readonly eventsReadService: EventsReadService) {}

  @Get()
  @ApiOperation({
    summary: 'List events',
    description: 'Returns published events ordered by date ASC.',
  })
  @ApiQuery({ name: 'fromDate', required: false, example: '2026-02-28' })
  @ApiQuery({ name: 'toDate', required: false, example: '2026-03-07' })
  @ApiQuery({ name: 'type', required: false, enum: DATETIME_TYPES })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiResponse({ status: 200, description: 'Paginated event list' })
  async findAll(
    @Query() query: EventQueryDto,
  ): Promise<AppApiResponse<unknown>> {
    const result = await this.eventsReadService.findAll({
      fromDate: query.fromDate,
      toDate: query.toDate,
      type: query.type,
      limit: query.limit,
      offset: query.offset,
    });
    return AppApiResponse.ok(result);
  }

  @Get('venue/:venue')
  @ApiOperation({
    summary: 'Find events by venue',
    description: 'Case-insensitive partial match.',
  })
  @ApiParam({ name: 'venue', example: 'Trust Hall' })
  @ApiResponse({ status: 200 })
  async findByVenue(
    @Param('venue') venue: string,
  ): Promise<AppApiResponse<unknown>> {
    return AppApiResponse.ok(await this.eventsReadService.findByVenue(venue));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async findOne(@Param('id') id: string): Promise<AppApiResponse<unknown>> {
    return AppApiResponse.ok(await this.eventsReadService.findOne(id));
  }
}
