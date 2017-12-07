import expect from 'expect.js';
import moment from 'moment';
import { formatTimestampToDuration } from '../format_timestamp_to_duration';
import { CALCULATE_DURATION_SINCE, CALCULATE_DURATION_UNTIL } from '../constants';

const testTime = moment('2010-05-01'); // pick a date where adding/subtracting 2 months formats roundly to '2 months 0 days'
const getTestTime = () => moment(testTime); // clones the obj so it's not mutated with .adds and .subracts

/**
 * Test the moment-duration-format template
 */
describe('formatTimestampToDuration', () => {
  describe('format timestamp to duration - time since', () => {
    it('should format timstamp to human-readable duration', () => {
      // time inputs are a few "moments" extra from the time advertised by name
      const fiftynineSeconds = getTestTime().subtract(59, 'seconds');
      expect(formatTimestampToDuration(fiftynineSeconds, CALCULATE_DURATION_SINCE, getTestTime())).to.be('59 seconds');

      const fiveMins = getTestTime().subtract(5, 'minutes').subtract(30, 'seconds');
      expect(formatTimestampToDuration(fiveMins, CALCULATE_DURATION_SINCE, getTestTime())).to.be('5 min');

      const sixHours = getTestTime().subtract(6, 'hours').subtract(30, 'minutes');
      expect(formatTimestampToDuration(sixHours, CALCULATE_DURATION_SINCE, getTestTime())).to.be('6 hrs 30 min');

      const sevenDays = getTestTime().subtract(7, 'days').subtract(6, 'hours').subtract(18, 'minutes');
      expect(formatTimestampToDuration(sevenDays, CALCULATE_DURATION_SINCE, getTestTime())).to.be('7 days 6 hrs 18 min');

      const eightWeeks = getTestTime().subtract(8, 'weeks').subtract(7, 'days').subtract(6, 'hours').subtract(18, 'minutes');
      expect(formatTimestampToDuration(eightWeeks, CALCULATE_DURATION_SINCE, getTestTime())).to.be('2 months 2 days');

      const oneHour = getTestTime().subtract(1, 'hour'); // should trim 0 min
      expect(formatTimestampToDuration(oneHour, CALCULATE_DURATION_SINCE, getTestTime())).to.be('1 hrs');

      const oneDay = getTestTime().subtract(1, 'day'); // should trim 0 hrs
      expect(formatTimestampToDuration(oneDay, CALCULATE_DURATION_SINCE, getTestTime())).to.be('1 days');

      const twoMonths = getTestTime().subtract(2, 'month'); // should trim 0 days
      expect(formatTimestampToDuration(twoMonths, CALCULATE_DURATION_SINCE, getTestTime())).to.be('2 months');
    });
  });

  describe('format timestamp to duration - time until', () => {
    it('should format timstamp to human-readable duration', () => {
      // time inputs are a few "moments" extra from the time advertised by name
      const fiftynineSeconds = getTestTime().add(59, 'seconds');
      expect(formatTimestampToDuration(fiftynineSeconds, CALCULATE_DURATION_UNTIL, getTestTime())).to.be('59 seconds');

      const fiveMins = getTestTime().add(10, 'minutes');
      expect(formatTimestampToDuration(fiveMins, CALCULATE_DURATION_UNTIL, getTestTime())).to.be('10 min');

      const sixHours = getTestTime().add(6, 'hours').add(30, 'minutes');
      expect(formatTimestampToDuration(sixHours, CALCULATE_DURATION_UNTIL, getTestTime())).to.be('6 hrs 30 min');

      const sevenDays = getTestTime().add(7, 'days').add(6, 'hours').add(18, 'minutes');
      expect(formatTimestampToDuration(sevenDays, CALCULATE_DURATION_UNTIL, getTestTime())).to.be('7 days 6 hrs 18 min');

      const eightWeeks = getTestTime().add(8, 'weeks').add(7, 'days').add(6, 'hours').add(18, 'minutes');
      expect(formatTimestampToDuration(eightWeeks, CALCULATE_DURATION_UNTIL, getTestTime())).to.be('2 months 2 days');

      const oneHour = getTestTime().add(1, 'hour'); // should trim 0 min
      expect(formatTimestampToDuration(oneHour, CALCULATE_DURATION_UNTIL, getTestTime())).to.be('1 hrs');

      const oneDay = getTestTime().add(1, 'day'); // should trim 0 hrs
      expect(formatTimestampToDuration(oneDay, CALCULATE_DURATION_UNTIL, getTestTime())).to.be('1 days');

      const twoMonths = getTestTime().add(2, 'month'); // should trim 0 days
      expect(formatTimestampToDuration(twoMonths, CALCULATE_DURATION_UNTIL, getTestTime())).to.be('2 months');
    });
  });
});
