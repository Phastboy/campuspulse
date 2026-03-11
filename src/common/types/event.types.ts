export const EVENT_STATUS = {
  PENDING: 'pending',
  LIVE: 'live',
  REJECTED: 'rejected',
}

export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS];
