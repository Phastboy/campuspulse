import { Injectable, Logger } from '@nestjs/common';
import handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MailTemplateService {
  private readonly logger = new Logger(MailTemplateService.name);
  private templatesCache = new Map<string, handlebars.TemplateDelegate>();

  async compile(templateName: string, context: Record<string, any> = {}): Promise<string> {
    try {
      let templateDelegate = this.templatesCache.get(templateName);

      if (!templateDelegate) {
        const templatesDir = path.join(process.cwd(), 'src', 'mail', 'templates');
        const templatePath = path.join(templatesDir, `${templateName}.hbs`);
        
        const templateContent = await fs.readFile(templatePath, 'utf8');
        templateDelegate = handlebars.compile(templateContent);
        
        // Cache for future use
        this.templatesCache.set(templateName, templateDelegate);
      }

      return templateDelegate(context);
    } catch (error) {
      this.logger.error(`Failed to compile template ${templateName}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
