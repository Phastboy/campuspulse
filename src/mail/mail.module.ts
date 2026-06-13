import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MailAdapter } from './mail.adapter.js';
import { NodemailerAdapter } from './adapters/nodemailer.adapter.js';
import { MailService } from './mail.service.js';
import { MailTemplateService } from './mail-template.service.js';
import { MailQueueService } from './mail-queue.service.js';
import { MailProcessor } from './mail.processor.js';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'mail',
    }),
  ],
  providers: [
    {
      provide: MailAdapter,
      useClass: NodemailerAdapter,
    },
    MailTemplateService,
    MailService,
    MailQueueService,
    MailProcessor,
  ],
  exports: [MailService, MailAdapter, MailTemplateService, MailQueueService],
})
export class MailModule {}
