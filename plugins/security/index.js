import hapiAuthCookie from 'hapi-auth-cookie';
import { resolve } from 'path';
import basicAuth from './server/lib/basic_auth';
import getIsValidUser from './server/lib/get_is_valid_user';
import getValidate from './server/lib/get_validate';
import getCalculateExpires from './server/lib/get_calculate_expires';
import initAuthenticateApi from './server/routes/api/v1/authenticate';
import initUsersApi from './server/routes/api/v1/users';
import initRolesApi from './server/routes/api/v1/roles';
import initIndicesApi from './server/routes/api/v1/indices';
import initLoginView from './server/routes/views/login';
import initLogoutView from './server/routes/views/logout';
import validateConfig from './server/lib/validate_config';
import setElasticsearchAuth from './server/lib/set_elasticsearch_auth';
import createScheme from './server/lib/login_scheme';

export default (kibana) => new kibana.Plugin({
  id: 'security',
  configPrefix: 'xpack.security',
  publicDir: resolve(__dirname, 'public'),
  require: ['kibana', 'elasticsearch', 'xpackMain'],

  config(Joi) {
    return Joi.object({
      enabled: Joi.boolean().default(true),
      cookieName: Joi.string().default('sid'),
      encryptionKey: Joi.string(),
      sessionTimeout: Joi.number().default(30 * 60 * 1000),
      useUnsafeSessions: Joi.boolean().default(false),
      skipSslCheck: Joi.boolean().default(false)
    }).default();
  },

  uiExports: {
    chromeNavControls: ['plugins/security/views/logout_button'],
    settingsSections: ['plugins/security/views/settings'],
    apps: [{
      id: 'login',
      title: 'Login',
      main: 'plugins/security/views/login',
      hidden: true
    }, {
      id: 'logout',
      title: 'Logout',
      main: 'plugins/security/views/logout',
      hidden: true
    }],
    hacks: ['plugins/security/hacks/on_session_timeout'],
    injectDefaultVars: function (server) {
      const config = server.config();
      return {
        shieldUnsafeSessions: config.get('xpack.security.useUnsafeSessions'),
        sessionTimeout: config.get('xpack.security.sessionTimeout')
      };
    }
  },

  preInit(server) {
    setElasticsearchAuth(server.config());
  },

  init(server) {
    const xpackMainPluginStatus = server.plugins.xpackMain.status;
    if (xpackMainPluginStatus.state === 'red') {
      this.status.red(xpackMainPluginStatus.message);
      return;
    };

    const config = server.config();
    validateConfig(config, message => server.log(['security', 'warning'], message));

    const cookieName = config.get('xpack.security.cookieName');
    server.register(hapiAuthCookie, (error) => {
      if (error != null) throw error;

      server.auth.scheme('login', createScheme({
        redirectUrl: (path) => loginUrl(config.get('server.basePath'), path),
        strategy: 'security'
      }));

      server.auth.strategy('session', 'login', 'required');

      server.auth.strategy('security', 'cookie', false, {
        cookie: cookieName,
        password: config.get('xpack.security.encryptionKey'),
        path: config.get('server.basePath') + '/',
        clearInvalid: true,
        validateFunc: getValidate(server),
        isSecure: !config.get('xpack.security.useUnsafeSessions')
      });
    });

    basicAuth.register(server, cookieName, getIsValidUser(server), getCalculateExpires(server));

    initAuthenticateApi(server);
    initUsersApi(server);
    initRolesApi(server);
    initIndicesApi(server);
    initLoginView(server, this);
    initLogoutView(server, this);
  }
});

function loginUrl(baseUrl, requestedPath) {
  const next = encodeURIComponent(requestedPath);
  return `${baseUrl}/login?next=${next}`;
}
