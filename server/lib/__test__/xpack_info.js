const expect = require('expect.js');
const Bluebird = require('bluebird');
import moment from 'moment';
const xpackInfo = require('../xpack_info');

describe('xpack_info', function () {

  let mockClient;
  let clientResponse;

  function setClientResponse(obj) {
    clientResponse = Bluebird.resolve(obj);
  }

  beforeEach(function () {
    mockClient = {
      transport: {
        request: () => Bluebird.resolve(clientResponse)
      }
    };
  });

  describe('license', function () {
    describe('isActive()', function () {
      it ('returns true if the license is active', function () {
        setClientResponse({ license: { status: 'active' }});
        xpackInfo(mockClient).then(info => {
          expect(info.license.isActive()).to.be(true);
          info.stopPolling();
        });
      });
      it ('returns false if the license has expired', function () {
        setClientResponse({ license: { status: 'expired' }});
        xpackInfo(mockClient).then(info => {
          expect(info.license.isActive()).to.be(false);
          info.stopPolling();
        });
      });
    });

    describe('expiresSoon()', function () {
      it ('returns true if the license will expire within 30 days', function () {
        const licenseExpirationDate = moment.utc().add('20', 'days');
        setClientResponse({ license: { expiry_date_in_millis: licenseExpirationDate.valueOf() }});
        xpackInfo(mockClient).then(info => {
          expect(info.license.expiresSoon()).to.be(true);
          info.stopPolling();
        });
      });
      it ('returns false if the license will expire after 30 days', function () {
        const licenseExpirationDate = moment.utc().add('40', 'days');
        setClientResponse({ license: { expiry_date_in_millis: licenseExpirationDate.valueOf() }});
        xpackInfo(mockClient).then(info => {
          expect(info.license.expiresSoon()).to.be(false);
          info.stopPolling();
        });
      });
    });

    describe('isOneOf()', function () {
      it ('returns true if the license is the single given mode', function () {
        setClientResponse({ license: { mode: 'gold' }});
        xpackInfo(mockClient).then(info => {
          expect(info.license.isOneOf('gold')).to.be(true);
          info.stopPolling();
        });
      });
      it ('returns true if the license is one of multiple given modes', function () {
        setClientResponse({ license: { mode: 'gold' }});
        xpackInfo(mockClient).then(info => {
          expect(info.license.isOneOf([ 'trial', 'gold' ])).to.be(true);
          info.stopPolling();
        });
      });
      it ('returns false if the license is not one of the multiple given modes', function () {
        setClientResponse({ license: { mode: 'basic' }});
        xpackInfo(mockClient).then(info => {
          expect(info.license.isOneOf([ 'trial', 'gold' ])).to.be(false);
          info.stopPolling();
        });
      });
    });
  });

  describe('feature', function () {
    describe('isAvailable()', function () {
      it ('returns true if the given feature is available', function () {
        setClientResponse({ features: { graph: { available: true } } });
        xpackInfo(mockClient).then(info => {
          expect(info.feature('graph').isAvailable()).to.be(true);
          info.stopPolling();
        });
      });
      it ('returns false if the given feature is not available', function () {
        setClientResponse({ features: { graph: { available: false } } });
        xpackInfo(mockClient).then(info => {
          expect(info.feature('graph').isAvailable()).to.be(false);
          info.stopPolling();
        });
      });
    });

    describe('isEnabled()', function () {
      it ('returns true if the given feature is enabled', function () {
        setClientResponse({ features: { graph: { enabled: true } } });
        xpackInfo(mockClient).then(info => {
          expect(info.feature('graph').isEnabled()).to.be(true);
          info.stopPolling();
        });
      });
      it ('returns false if the given feature is not enabled', function () {
        setClientResponse({ features: { graph: { enabled: false } } });
        xpackInfo(mockClient).then(info => {
          expect(info.feature('graph').isEnabled()).to.be(false);
          info.stopPolling();
        });
      });
    });
  });

  describe('an updated response from the _xpack API', function () {
    it ('causes the info object to be updated', function (done) {
      setClientResponse({ license: { status: 'active' }});
      const pollFrequencyInMillis = 10;
      xpackInfo(mockClient, pollFrequencyInMillis)
      .then(info => {
        expect(info.license.isActive()).to.be(true);
        setClientResponse({ license: { status: 'expired' }});
        return Bluebird.delay(pollFrequencyInMillis * 2, info);
      })
      .then((info) => {
        info.stopPolling();
        expect(info.license.isActive()).to.be(false);
      })
      .then(done);
    });
  });
});
