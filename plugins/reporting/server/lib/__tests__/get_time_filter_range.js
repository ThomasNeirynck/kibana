import expect from 'expect.js';
import { getTimeFilterRange } from '../get_time_filter_range';

describe('getTimeFilterRange', () => {
  const query = {
    _g: `(time:(from:'2016-07-09T13:15:00.000Z',mode:absolute,to:'2016-07-19T13:14:00.000Z'))`
  };

  describe('for a single saved object (search or visualization)', () => {
    it ('returns a valid time range', () => {
      const mockSavedObjects = [{ isUsingTimeBasedIndexPattern: true }];

      const timeRange = getTimeFilterRange(mockSavedObjects, query);
      expect(timeRange.from).to.be.a('string');
      expect(timeRange.to).to.be.a('string');
    });
  });

  describe('for a saved dashboard with multiple objects', () => {
    it ('returns a valid time range', () => {
      const mockSavedObjects = [
        { isUsingTimeBasedIndexPattern: false },
        { isUsingTimeBasedIndexPattern: false },
        { isUsingTimeBasedIndexPattern: true },
        { isUsingTimeBasedIndexPattern: false }
      ];

      const timeRange = getTimeFilterRange(mockSavedObjects, query);
      expect(timeRange.from).to.be.a('string');
      expect(timeRange.to).to.be.a('string');
    });
  });
});
