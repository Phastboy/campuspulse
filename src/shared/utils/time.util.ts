/**
 * Utility for working with the ES2026 Temporal API.
 *
 * Provides robust time generation avoiding legacy Date timezone issues.
 */

import { Temporal } from '@js-temporal/polyfill';

export class TimeUtil {
  /**
   * Returns the exact current instant as a Temporal.Instant
   */
  static currentInstant() {
    return Temporal.Now.instant();
  }

  /**
   * Returns the current time as a legacy JS Date object
   * derived reliably from a Temporal.Instant.
   */
  static currentLegacyDate(): Date {
    // We get the exact epoch milliseconds from Temporal
    // which avoids timezone-related parsing errors of `new Date()`.
    return new Date(Temporal.Now.instant().epochMilliseconds);
  }
}
