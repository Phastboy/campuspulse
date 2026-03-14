/**
 * Thrown by {@link EventDateTimeAssembler} when a datetime update payload
 * is structurally invalid — for example, switching to `specific` type without
 * providing a `startTime`.
 *
 * This is a plain domain error with no HTTP dependency. The application
 * service layer ({@link EventsService}) catches it and translates it to
 * a `BadRequestException` at the HTTP boundary, where such concerns belong.
 */
export class InvalidDatetimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDatetimeError';
  }
}
