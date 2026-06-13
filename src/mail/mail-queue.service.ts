import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SendMailOptions } from './mail.adapter.js';

@Injectable()
export class MailQueueService {
  constructor(@InjectQueue('mail') private readonly mailQueue: Queue) {}

  async enqueueMail(options: SendMailOptions): Promise<void> {
    await this.mailQueue.add('send', options, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
