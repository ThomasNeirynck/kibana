import expect from 'expect.js';
import sinon from 'sinon';

import replyFixture from './__fixtures__/reply';
import requestFixture from './__fixtures__/request';
import serverFixture from './__fixtures__/server';

import * as loginScheme from '../login_scheme';

describe('lib/login_scheme', function () {
  describe('#default()', () => {
    describe('returned function', () => {
      let scheme;
      let params;
      let server;
      let request;
      let reply;

      beforeEach(() => {
        params = {
          redirectUrl: sinon.stub().returns('mock redirect url'),
          strategies: ['wat', 'huh']
        };
        server = serverFixture();
        request = requestFixture();
        reply = replyFixture();

        scheme = loginScheme.default(params);
      });

      it('returns object with authentication function', () => {
        const { authenticate } = scheme(server);
        expect(authenticate).to.be.a('function');
      });

      describe('returned authentication function', () => {
        it('invokes server.auth.test with strategies', () => {
          server.auth.test.yields(undefined, {});
          const { authenticate } = scheme(server);
          return authenticate(request, reply).then(() => {
            params.strategies.forEach((strategy) => {
              sinon.assert.calledWith(server.auth.test, strategy);
            });
          });
        });
        it('continues request with credentials on success', () => {
          server.auth.test.yields(undefined, {});
          const { authenticate } = scheme(server);
          return authenticate(request, reply).then(() => {
            sinon.assert.called(reply.continue);
          });
        });
        it('redirects html request on error', () => {
          server.auth.test.yields(new Error());
          const { authenticate } = scheme(server);
          return authenticate(request, reply).then(() => {
            sinon.assert.called(params.redirectUrl);
            sinon.assert.calledWith(reply.redirect, 'mock redirect url');
          });
        });
        it('replies with error for xhr requests on error', () => {
          request.raw.req.headers['kbn-version'] = 'something';
          server.auth.test.yields(new Error());
          const { authenticate } = scheme(server);
          return authenticate(request, reply).then(() => {
            sinon.assert.called(reply);
            const error = reply.getCall(0).args[0];
            expect(error.message).to.be('Unauthorized');
            expect(error.output.payload.statusCode).to.be(401);
          });
        });
      });
    });
  });
});
