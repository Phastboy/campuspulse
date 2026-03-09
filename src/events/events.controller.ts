import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { Event } from './entities/event.entity';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event successfully created',
    type: Event
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiBody({ type: CreateEventDto })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated events',
    schema: {
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/Event' } },
        total: { type: 'number' }
      }
    }
  })
  findAll(@Query() query: EventQueryDto): Promise<{ items: Event[]; total: number }> {
    return this.eventsService.findAll(query);
  }

  @Get('upcoming/week')
  @ApiOperation({ summary: 'Get all live events happening in the next 7 days' })
  @ApiResponse({
    status: 200,
    description: 'Returns upcoming events',
    type: [Event]
  })
  findUpcomingThisWeek(): Promise<Event[]> {
    return this.eventsService.findUpcomingThisWeek();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get event statistics by category' })
  @ApiResponse({
    status: 200,
    description: 'Returns event statistics'
  })
  getStats(): Promise<any> {
    return this.eventsService.getEventStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single event by ID' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns the event', type: Event })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id') id: string): Promise<Event> {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'Event updated successfully', type: Event })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiBody({ type: UpdateEventDto })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto
  ): Promise<Event> {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({ status: 204, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.eventsService.remove(id);
  }
}
