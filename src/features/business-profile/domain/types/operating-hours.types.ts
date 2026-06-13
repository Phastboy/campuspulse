export enum DayOfWeek {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}

export interface OperatingHours {
  readonly id: string;
  readonly businessProfileId: string;
  readonly day: DayOfWeek;
  readonly openTime: string;
  readonly closeTime: string;
  readonly isClosed: boolean;
}

export interface SetOperatingHoursInput {
  readonly day: DayOfWeek;
  readonly openTime: string;
  readonly closeTime: string;
  readonly isClosed: boolean;
}
