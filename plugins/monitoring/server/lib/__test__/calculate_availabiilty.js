import expect from 'expect.js';
import moment from 'moment';
import calculateAvailability from '../calculate_availability';

describe('Calculate Availability', () => {
  it('is available', () => {
    const input = moment();
    expect(calculateAvailability(input)).to.be(true);
  });

  it('is not available', () => {
    const input = moment().subtract(11, 'minutes');
    expect(calculateAvailability(input)).to.be(false);
  });
});
