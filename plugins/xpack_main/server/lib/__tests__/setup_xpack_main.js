import expect from 'expect.js';
import { set } from 'lodash';
import sinon from 'sinon';
import { _xpackInfo } from '../../../../../server/lib/_xpack_info';
import { setupXPackMain } from '../setup_xpack_main';

describe('setupXPackMain()', () => {

  class MockErrorResponse extends Error {
    constructor(status) {
      super();
      this.status = status;
    }
  }

  let mockServer;
  let mockXPackMainPlugin;

  beforeEach(() => {
    mockServer = {
      plugins: {
        elasticsearch: {
          getCluster: sinon.stub().withArgs('data').returns({
            callWithInternalUser: sinon.stub()
          })
        }
      },
      log() {},
      config: () => ({ get: sinon.stub() }),
      expose(key, value) {
        set(this, [ 'pluginProperties', key ], value);
      },
      ext(e, handler) {
        set(this, [ 'eventHandlers', e ], handler);
      }
    };

    mockXPackMainPlugin = {
      status: {
        green(message) {
          this.message = message;
          this.state = 'green';
        },
        red(message) {
          this.message = message;
          this.state = 'red';
        }
      }
    };
  });

  afterEach(() => mockServer.pluginProperties.info.stopPolling());

  describe('Elasticsearch APIs return successful responses with license', () => {

    beforeEach(() => {
      mockServer.plugins.elasticsearch.getCluster('data').callWithInternalUser.returns(Promise.resolve({ license: {} }));
    });

    it ('server should have an onPreResponse event handler registered', () => {
      return setupXPackMain(mockServer, mockXPackMainPlugin, _xpackInfo)
      .then(() => {
        expect(mockServer.eventHandlers.onPreResponse).to.be.a(Function);
      });
    });

    it ('xpack_main plugin should expose the xpack info property', () => {
      return setupXPackMain(mockServer, mockXPackMainPlugin, _xpackInfo)
      .then(() => {
        expect(mockServer.pluginProperties.info).to.be.an(Object);
        expect(mockServer.pluginProperties.info.isAvailable).to.be.a(Function);
      });
    });

    it ('xpack_main plugin status should be green', () => {
      return setupXPackMain(mockServer, mockXPackMainPlugin, _xpackInfo)
      .then(() => {
        expect(mockXPackMainPlugin.status.state).to.be('green');
        expect(mockXPackMainPlugin.status.message).to.be('Ready');
      });
    });
  });

  describe('Elasticsearch APIs return a non-400 error response', () => {
    it ('xpack_main plugin status should be red', () => {
      mockServer.plugins.elasticsearch.getCluster('data').callWithInternalUser.returns(Promise.reject(new MockErrorResponse(500)));

      return setupXPackMain(mockServer, mockXPackMainPlugin, _xpackInfo)
      .then(() => {
        expect(mockServer.eventHandlers).to.be(undefined);
        expect(mockXPackMainPlugin.status.state).to.be('red');
      });
    });
  });

  describe('Elasticsearch APIs return a 400 response', () => {
    it ('xpack_main plugin status should be red and x-pack not installed error message should be set', () => {
      mockServer.plugins.elasticsearch.getCluster('data').callWithInternalUser.returns(Promise.reject(new MockErrorResponse(400)));

      return setupXPackMain(mockServer, mockXPackMainPlugin, _xpackInfo)
      .then(() => {
        expect(mockServer.eventHandlers).to.be(undefined);
        expect(mockXPackMainPlugin.status.state).to.be('red');
        expect(mockXPackMainPlugin.status.message).to.be('X-Pack plugin is not installed on Elasticsearch cluster');
      });
    });
  });

});
