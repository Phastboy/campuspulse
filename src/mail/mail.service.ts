import { Injectable } from '@nestjs/common';
import { MailAdapter, SendMailOptions } from './mail.adapter.js';
import { MailTemplateService } from './mail-template.service.js';

@Injectable()
export class MailService {
  constructor(
    private readonly adapter: MailAdapter,
    private readonly templateService: MailTemplateService,
  ) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    const finalOptions = { ...options };

    if (options.template) {
      finalOptions.html = await this.templateService.compile(
        options.template,
        options.context || {},
      );
    }

    return this.adapter.sendMail(finalOptions);
  }
}
