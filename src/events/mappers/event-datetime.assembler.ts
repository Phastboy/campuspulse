import { AllDayDate, EventDateTime, SpecificDateTime } from '@common';
import { InvalidDatetimeError } from '../domain/invalid-datetime.error';
import { UpdateEventDto } from '../dto/update-event.dto';

/**
 * Assembles an updated {@link EventDateTime} from a partial update payload.
 *
 * Pure domain logic — no HTTP framework imports. Throws {@link InvalidDatetimeError}
 * (a plain `Error` subclass) rather than `BadRequestException`. The service
 * layer catches that error and translates it to an HTTP response at the
 * boundary where HTTP concerns belong.
 */
export class EventDateTimeAssembler {
  /**
   * Merges `updateData` fields onto `current` to produce a new `EventDateTime`.
   *
   * @throws {InvalidDatetimeError} When switching to `specific` without a `startTime`
   */
  applyUpdate(
    current: EventDateTime,
    updateData: UpdateEventDto,
  ): EventDateTime {
    const newType = updateData.type ?? current.type;
    return newType === 'specific'
      ? this.assembleSpecific(current, updateData)
      : this.assembleAllDay(current, updateData);
  }

  private assembleSpecific(
    current: EventDateTime,
    updateData: UpdateEventDto,
  ): SpecificDateTime {
    const isSwitchingType = current.type !== 'specific';

    if (isSwitchingType && !updateData.startTime) {
      throw new InvalidDatetimeError(
        'startTime is required when switching to a specific datetime event',
      );
    }

    const currentSpecific = current.type === 'specific' ? current : null;

    return {
      type: 'specific',
      date: updateData.date
        ? new Date(updateData.date)
        : (currentSpecific?.date ?? new Date()),
      startTime: updateData.startTime
        ? new Date(updateData.startTime)
        : (currentSpecific?.startTime ?? new Date()),
      endTime: updateData.endTime
        ? new Date(updateData.endTime)
        : currentSpecific?.endTime,
    };
  }

  private assembleAllDay(
    current: EventDateTime,
    updateData: UpdateEventDto,
  ): AllDayDate {
    const currentAllDay = current.type === 'all-day' ? current : null;

    return {
      type: 'all-day',
      date: updateData.date
        ? new Date(updateData.date)
        : (currentAllDay?.date ?? new Date()),
      endDate: updateData.endDate
        ? new Date(updateData.endDate)
        : currentAllDay?.endDate,
    };
  }
}
