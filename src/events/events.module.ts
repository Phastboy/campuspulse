import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { MikroOrmEventRepository } from './repositories/mikro-orm-event.repository';
import { MikroOrmTransactionManager } from './repositories/mikro-orm-transaction-manager';
import { EventDateTimeAssembler } from './mappers/event-datetime.assembler';
import { EVENT_READER } from './ports/event-reader.port';
import { EVENT_WRITER } from './ports/event-writer.port';
import { CANDIDATE_REPOSITORY } from '../ingestion/ports/candidate-repository.port';
import { TRANSACTION_MANAGER } from '../common/ports/transaction-manager.port';

/**
 * Feature module for published events.
 *
 * All cross-module tokens (`CANDIDATE_REPOSITORY`, `TRANSACTION_MANAGER`) are
 * exported so `IngestionModule` receives them without redeclaring infrastructure.
 * `EventDateTimeMapper` has moved to `ingestion/mappers/` — it is no longer
 * declared or exported here.
 */
@Module({
  imports: [MikroOrmModule.forFeature([Event])],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventDateTimeAssembler,
    MikroOrmEventRepository,
    MikroOrmTransactionManager,
    { provide: EVENT_READER, useExisting: MikroOrmEventRepository },
    { provide: EVENT_WRITER, useExisting: MikroOrmEventRepository },
    { provide: CANDIDATE_REPOSITORY, useExisting: MikroOrmEventRepository },
    { provide: TRANSACTION_MANAGER, useExisting: MikroOrmTransactionManager },
  ],
  exports: [
    EVENT_READER,
    EVENT_WRITER,
    CANDIDATE_REPOSITORY,
    TRANSACTION_MANAGER,
  ],
})
export class EventsModule {}
