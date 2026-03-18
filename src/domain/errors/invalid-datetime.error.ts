/**
 * Thrown by {@link EventDateTimeAssembler} when a datetime update payload
 * is structurally invalid — for example, switching to `specific` type without
 * providing a `startTime`.
 *
 * Plain domain error with no HTTP or framework dependency.
 * {@link EventsWriteService} catches it and translates to `BadRequestException`
 * at the HTTP boundary, where such concerns belong.
 */
export class InvalidDatetimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDatetimeError';
  }
}
