import { EventDateTime } from './event-datetime.interface.js';

export type DateParseSuccess = {
  success: true;
  parsed: EventDateTime;
  confidence: number;
  original: string;
};

export type DateParseFailure = {
  success: false;
  error: string;
  original: string;
};

export type DateParseResult = DateParseSuccess | DateParseFailure;
