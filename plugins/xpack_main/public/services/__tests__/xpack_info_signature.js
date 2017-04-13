import expect from 'expect.js';
import ngMock from 'ng_mock';
import { XPackInfoSignatureProvider } from 'plugins/xpack_main/services/xpack_info_signature';
import { MockWindowProvider } from './_mock_window';

const XPACK_INFO_SIG_KEY = 'xpackMain.infoSignature';

describe.skip('xpack_info_signature service', () => {
  let mockWindow;
  let xpackInfoSignature;

  beforeEach(ngMock.module('kibana', ($provide) => {
    $provide.service('$window', MockWindowProvider);
  }));

  beforeEach(ngMock.inject(($window, Private) => {
    mockWindow = $window;
    xpackInfoSignature = Private(XPackInfoSignatureProvider);
  }));

  it ('updates the stored xpack info signature', () => {
    const updatedXPackInfoSignature = 'foobar';
    xpackInfoSignature.set(updatedXPackInfoSignature);
    expect(mockWindow.sessionStorage.getItem(XPACK_INFO_SIG_KEY)).to.be(updatedXPackInfoSignature);
    expect(xpackInfoSignature.get()).to.be(updatedXPackInfoSignature);
  });

  it ('clears the stored xpack info signature', () => {
    const updatedXPackInfoSignature = 'foobar';
    xpackInfoSignature.set(updatedXPackInfoSignature);
    expect(xpackInfoSignature.get()).not.to.be(undefined);

    xpackInfoSignature.clear();
    expect(mockWindow.sessionStorage.getItem(XPACK_INFO_SIG_KEY)).to.be(undefined);
    expect(xpackInfoSignature.get()).to.be(undefined);
  });
});
