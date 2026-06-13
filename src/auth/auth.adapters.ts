import { Logger } from '@nestjs/common';
import { ClockPort, LoggerPort } from '@odysseon/whoami-core';

export class UuidGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}

import { TimeUtil } from '../shared/utils/time.util.js';

export class SystemClock implements ClockPort {
  now(): Date {
    return TimeUtil.currentLegacyDate();
  }
}

export class NestLoggerAdapter implements LoggerPort {
  private readonly logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  info(message: unknown, ...optionalParams: unknown[]) {
    this.logger.log(message, ...optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.logger.error(message, ...optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.logger.warn(message, ...optionalParams);
  }
}
