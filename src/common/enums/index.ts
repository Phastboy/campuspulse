export enum EventCategory {
  TECH = 'tech',
  ACADEMIC = 'academic',
  ENTERTAINMENT = 'entertainment',
  SPORTS = 'sports',
  WELFARE = 'welfare',
  ONLINE = 'online',
  OTHER = 'other',
}

export enum PricingTag {
  FREE = 'free',
  PAID = 'paid',
  CONDITIONAL = 'conditional',
}

export enum LocationTag {
  ON_CAMPUS = 'on-campus',
  OFF_CAMPUS = 'off-campus',
  ONLINE = 'online',
}

export enum RsvpStatus {
  OPEN_ENTRY = 'open-entry',
  REGISTER = 'register',
  BUY_TICKET = 'buy-ticket',
}

export enum EventStatus {
  LIVE = 'live',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged', // possible duplicate — routed to exceptions queue
  MERGED = 'merged', // merged into an existing event
}
