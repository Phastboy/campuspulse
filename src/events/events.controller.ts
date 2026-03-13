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
 * Events reach this resource in one of two ways:
 * - Auto-published by the ingestion pipeline after a clean submission
 * - Directly created by a Phase 1 curator
 *
 * Read endpoints (`GET /events`, `GET /events/:id`, `GET /events/venue/:venue`)
 * are public. Mutating endpoints are intended for the curator/moderator role
 * and will be protected by JWT guards in Phase 2.
 */
@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Returns a paginated list of published events, ordered by date ascending.
   *
   * All query parameters are optional. When omitted, all published events are
   * returned subject to the default pagination (`limit=20`, `offset=0`).
   *
   * @param query - Date range, datetime type filter, and pagination options
   * @returns Paginated result containing `items`, `total`, `limit`, and `offset`
   *
   * @example
   * GET /api/events?fromDate=2026-02-28&toDate=2026-02-28&limit=20&offset=0
   */
  @Get()
  @ApiOperation({
    summary: 'List events',
    description:
      'Returns published events ordered by date ASC. Supports date range, type filter, and pagination.',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    example: '2026-02-28',
    description: 'ISO date — include events on or after this date',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    example: '2026-03-07',
    description: 'ISO date — include events on or before this date',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: DATETIME_TYPES,
    description: 'Filter by datetime shape',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: 'Page size (default 20, minimum 1)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    example: 0,
    description: 'Page offset (default 0)',
  })
  @ApiResponse({ status: 200, description: 'Paginated event list' })
  async findAll(
    @Query() query: EventQueryDto,
  ): Promise<AppApiResponse<unknown>> {
    const result = await this.eventsService.findAll(query);
    return AppApiResponse.ok(result);
  }

  /**
   * Returns all events whose venue name matches the given string.
   *
   * The match is case-insensitive and partial — `"trust"` matches `"Trust Hall"`.
   * Useful for checking what is already scheduled at a venue before submitting.
   *
   * @param venue - Partial or full venue name
   * @returns All matching events (may be an empty array)
   *
   * @example
   * GET /api/events/venue/Trust%20Hall
   * GET /api/events/venue/ACE
   */
  @Get('venue/:venue')
  @ApiOperation({
    summary: 'Find events by venue',
    description: 'Case-insensitive partial match on venue name.',
  })
  @ApiParam({
    name: 'venue',
    example: 'Trust Hall',
    description: 'Partial or full venue name',
  })
  @ApiResponse({ status: 200, description: 'Events at matching venues' })
  async findByVenue(
    @Param('venue') venue: string,
  ): Promise<AppApiResponse<unknown>> {
    const events = await this.eventsService.findByVenue(venue);
    return AppApiResponse.ok(events);
  }

  /**
   * Returns a single event by its UUID.
   *
   * Used to populate the event detail page on the frontend.
   *
   * @param id - Event UUID
   * @returns The matching event
   *
   * @example
   * GET /api/events/a1b2c3d4-e5f6-7890-abcd-ef1234567890
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({
    name: 'id',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Event UUID',
  })
  @ApiResponse({ status: 200, description: 'Event found' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(@Param('id') id: string): Promise<AppApiResponse<unknown>> {
    const event = await this.eventsService.findOne(id);
    return AppApiResponse.ok(event);
  }

  /**
   * Applies a partial update to an existing event.
   *
   * All fields are optional — only fields included in the request body are
   * changed. Useful for rescheduling (update `date` + `startTime`),
   * relocating (update `venue`), or noting a cancellation (update `description`).
   *
   * When updating `datetime`, the full new shape must be provided — partial
   * datetime patching (e.g. changing only the time without specifying `type`)
   * may produce unexpected results.
   *
   * @param id - UUID of the event to update
   * @param updateData - Fields to update (all optional)
   * @returns The updated event
   *
   * @example
   * // Reschedule
   * PATCH /api/events/uuid
   * { "date": "2026-03-07", "type": "specific", "startTime": "2026-03-07T10:00:00.000Z" }
   *
   * @example
   * // Change venue only
   * PATCH /api/events/uuid
   * { "venue": "New Admin Block, Room 101" }
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update an event',
    description:
      'Partial update — only provided fields are changed. See UpdateEventDto for all available fields.',
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
      const event = await this.eventsService.update(id, updateData);
      return AppApiResponse.ok(event);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(message);
    }
  }

  /**
   * Permanently deletes an event from the database.
   *
   * This is a hard delete with no recovery mechanism. Prefer updating
   * `description` to note a cancellation so students who already found
   * the event still have a record of it.
   *
   * @param id - UUID of the event to delete
   *
   * @example
   * DELETE /api/events/a1b2c3d4-e5f6-7890-abcd-ef1234567890
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an event',
    description:
      'Hard delete. Prefer updating description to note a cancellation rather than deleting.',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.eventsService.remove(id);
  }
}
