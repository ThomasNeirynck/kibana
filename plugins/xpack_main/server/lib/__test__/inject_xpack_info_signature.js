import expect from 'expect.js';
import injectXPackInfoSignature from '../inject_xpack_info_signature';

describe('injectXPackInfoSignature()', () => {

  class MockErrorResponse extends Error {
    constructor() {
      super();
      this.output = {
        headers: {}
      };
    }
  }

  class MockResponse {
    constructor() {
      this.headers = {};
    }
  }

  let mockInfo;
  let mockReply;

  beforeEach(() => {
    mockInfo = {
      refreshNow() {
        return new Promise((resolve) => {
          this.signature = 'changed-signature';
          resolve(this);
        });
      },
      getSignature() {
        return this.signature || 'initial-signature';
      }
    };

    mockReply = {
      continue() {}
    };
  });

  it ('sets the kbn-xpack-sig header for error responses', () => {
    const mockRequest = {
      response: new MockErrorResponse()
    };

    return injectXPackInfoSignature(mockInfo, mockRequest, mockReply)
    .then(() => {
      expect(mockRequest.response.output.headers['kbn-xpack-sig']).to.be('changed-signature');
    });
  });

  it ('sets the kbn-xpack-sig header for success responses', () => {
    const mockRequest = {
      response: new MockResponse()
    };

    injectXPackInfoSignature(mockInfo, mockRequest, mockReply);
    expect(mockRequest.response.headers['kbn-xpack-sig']).to.be('initial-signature');
  });
});
