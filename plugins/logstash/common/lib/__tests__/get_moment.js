import expect from 'expect.js';
import { getMoment } from '../get_moment';

describe('get_moment', () => {

  describe('getMoment', () => {

    it(`returns a moment object when passed a date`, () => {
      const moment = getMoment('2017-03-30T14:53:08.121Z');

      expect(moment.constructor.name).to.be('Moment');
    });

    it(`returns null when passed falsy`, () => {
      const results = [
        getMoment(false),
        getMoment(0),
        getMoment(''),
        getMoment(null),
        getMoment(undefined),
        getMoment(NaN)
      ];

      results.forEach(result => {
        expect(result).to.be(null);
      });
    });

  });

});
