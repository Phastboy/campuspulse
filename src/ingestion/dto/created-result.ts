/** Result returned when the ingestion pipeline publishes a new event. */
export class CreatedResult {
  readonly action!: 'created';
  message!: string;
  eventId!: string;
}
