const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const Promise = require('bluebird');
const basicAuth = proxyquire('../../../server/lib/basic_auth', {
  './is_valid_user': (server) => Promise.resolve()
});

const authChecks = [
  ['user', 'notsecure', 'dXNlcjpub3RzZWN1cmU='],
  ['admin', 'slightly:more:secure', 'YWRtaW46c2xpZ2h0bHk6bW9yZTpzZWN1cmU='],
];

describe('Basic auth', function () {
  describe('register', function () {
    let mockServer;

    before(function () {
      mockServer = {
        ext: sinon.stub()
      };
    });

    it('should register pre auth handler', function () {
      basicAuth.register(mockServer, 'cookieName');

      expect(mockServer.ext.callCount).to.equal(1);
      expect(mockServer.ext.firstCall.args[0]).to.equal('onPreAuth');
      expect(mockServer.ext.firstCall.args[1]).to.be.a('function');
    });
  });

  describe('getHeader', function () {
    authChecks.forEach(function (check) {
      const [ username, password, base64 ] = check;

      it(`should return an authorization object for '${username}'`, function () {
        const header = basicAuth.getHeader(username, password);

        expect(header).to.be.an('object');
        expect(header).to.have.property('authorization');
        expect(header.authorization.split(' ')[0]).to.equal('Basic');
        expect(header.authorization.split(' ')[1]).to.equal(base64);
      });
    });
  });

  describe('parseHeader', function () {
    authChecks.forEach(function (pair) {
      const [ user, pass, base64 ] = pair;

      it(`should return username and password for '${user}'`, function () {
        const header = `Basic ${base64}`;
        const { username, password } = basicAuth.parseHeader(header);

        expect(username).to.equal(user);
        expect(password).to.equal(pass);
      });
    });

    it('should throw on non-string', function () {
      let check = () => basicAuth.parseHeader();
      expect(check).to.throw(/should be a string/);

      check = () => basicAuth.parseHeader({});
      expect(check).to.throw(/should be a string/);

      check = () => basicAuth.parseHeader([]);
      expect(check).to.throw(/should be a string/);
    });

    it('should throw if not Basic auth', function () {
      let check = () => basicAuth.parseHeader('Bearer xxxx');
      expect(check).to.throw(/not basic/i);

      check = () => basicAuth.parseHeader('blahblahblah');
      expect(check).to.throw(/not basic/i);
    });
  });
});