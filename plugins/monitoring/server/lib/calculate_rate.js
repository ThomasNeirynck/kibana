import moment from 'moment';

/*
 * Calculate "Per-Second" Rate from Metrics
 * Uses first/last totals and time window bounds in millis
 *
 * Indexing rate example:
 * 1. Take the latest index total
 * 2. From that subtract the earliest index total
 * This gives you the numerator
 *
 * 3. Take the latest timestamp from the time picker
 * 4. From that subtract the earliest timestamp from the time picker
 * This gives you the denominator in millis. Divide it by 1000 to convert to seconds
 */
export function calculateRate(
  {
    hitTimestamp = null,
    earliestHitTimestamp = null,
    latestTotal = null,
    earliestTotal = null,
    timeWindowMin,
    timeWindowMax
  } = {}
) {
  const hitTimestampMoment = moment(hitTimestamp).valueOf();
  const earliestHitTimestampMoment = moment(earliestHitTimestamp).valueOf();
  const hitsTimeDelta = hitTimestampMoment - earliestHitTimestampMoment;

  const earliestTimeInMillis = moment(timeWindowMin).valueOf();
  const latestTimeInMillis = moment(timeWindowMax).valueOf();
  const millisDelta = latestTimeInMillis - earliestTimeInMillis;

  if (hitsTimeDelta < 1) {
    return null;
  }

  let rate = null;
  if (millisDelta !== 0) {
    const totalDelta = latestTotal - earliestTotal;
    rate = totalDelta / (millisDelta / 1000);
  }

  return rate;
}
