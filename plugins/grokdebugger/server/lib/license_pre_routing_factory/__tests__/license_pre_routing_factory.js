import expect from 'expect.js';
import Boom from 'boom';
import { licensePreRoutingFactory } from '../license_pre_routing_factory';

describe('license_pre_routing_factory', () => {
  describe('#grokDebuggerFeaturePreRoutingFactory', () => {
    let mockServer;
    let mockLicenseCheckResults;

    beforeEach(() => {
      mockServer = {
        plugins: {
          xpack_main: {
            info: {
              feature: () => ({
                getLicenseCheckResults: () => mockLicenseCheckResults
              })
            }
          }
        }
      };
    });

    describe('isAvailable is false', () => {
      beforeEach(() => {
        mockLicenseCheckResults = {
          isAvailable: false
        };
      });

      it ('replies with 403', (done) => {
        const licensePreRouting = licensePreRoutingFactory(mockServer);
        const stubRequest = {};
        licensePreRouting(stubRequest, (response) => {
          expect(response).to.be.an(Error);
          expect(response.isBoom).to.be(true);
          expect(response.output.statusCode).to.be(403);
          done();
        });
      });
    });

    describe('isAvailable is true', () => {
      beforeEach(() => {
        mockLicenseCheckResults = {
          isAvailable: true
        };
      });

      it ('replies with nothing', (done) => {
        const licensePreRouting = licensePreRoutingFactory(mockServer);
        const stubRequest = {};
        licensePreRouting(stubRequest, (response) => {
          expect(response).to.eql(Boom.forbidden());
          done();
        });
      });
    });
  });
});
