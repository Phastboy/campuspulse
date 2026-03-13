import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';

/**
 * Feature module for published events.
 *
 * Owns all read and lifecycle operations on events that are already live.
 * Event creation flows through {@link IngestionModule} — this module handles
 * what happens after an event is published.
 *
 * {@link EventsService} is exported so {@link IngestionModule} can call
 * `findOne` when merging a submission into an existing event.
 */
@Module({
  imports: [MikroOrmModule.forFeature([Event])],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
