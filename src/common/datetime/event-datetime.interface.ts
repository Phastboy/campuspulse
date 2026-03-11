export type EventDateTime = SpecificDateTime | AllDayDate;

export interface SpecificDateTime {
  type: 'specific';
  date: Date;
  endTime?: Date;
}

export interface AllDayDate {
  type: 'all-day';
  date: Date;
  endDate?: Date;
}
