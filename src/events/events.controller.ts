import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { EventQueryDto } from './dto/event-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApiResponse as AppApiResponse } from '@common/dto/api-response.dto';
import { DATETIME_TYPES } from '@common/constants';

/**
 * Manages published events.
 *
 * The controller is responsible for the HTTP boundary: it receives HTTP types
 * (DTOs, query params) and maps them to domain types before calling the
 * service. {@link EventQueryDto} → {@link EventQuery} happens here.
 */
@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

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
    // Map HTTP DTO → domain query at the controller boundary
    const result = await this.eventsService.findAll({
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
    description: 'Case-insensitive partial match on venue name.',
  })
  @ApiParam({ name: 'venue', example: 'Trust Hall' })
  @ApiResponse({ status: 200, description: 'Events at matching venues' })
  async findByVenue(
    @Param('venue') venue: string,
  ): Promise<AppApiResponse<unknown>> {
    return AppApiResponse.ok(await this.eventsService.findByVenue(venue));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Event found' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(@Param('id') id: string): Promise<AppApiResponse<unknown>> {
    return AppApiResponse.ok(await this.eventsService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an event',
    description: 'Partial update — only provided fields are changed.',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: 200, description: 'Updated event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 400, description: 'Invalid update payload' })
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateEventDto,
  ): Promise<AppApiResponse<unknown>> {
    try {
      return AppApiResponse.ok(await this.eventsService.update(id, updateData));
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an event',
    description:
      'Hard delete. Prefer updating description to note a cancellation.',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.eventsService.remove(id);
  }
}
