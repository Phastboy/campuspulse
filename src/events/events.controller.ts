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
import { EventsService } from './events.service';
import { EventQueryDto } from './dto/event-query.dto';
import { ApiResponse } from '@common/dto/api-response.dto';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll(@Query() query: EventQueryDto) {
    const result = await this.eventsService.findAll(query);
    return ApiResponse.ok(result);
  }

  @Get('venue/:venue')
  async findByVenue(@Param('venue') venue: string) {
    const events = await this.eventsService.findByVenue(venue);
    return ApiResponse.ok(events);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const event = await this.eventsService.findOne(id);
    return ApiResponse.ok(event);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.eventsService.remove(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: UpdateEventDto) {
    try {
      const event = await this.eventsService.update(id, updateData);
      return ApiResponse.ok(event);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}
