import hapiAuthCookie from 'hapi-auth-cookie';
import {join} from 'path';
import basicAuth from './server/lib/basic_auth';
import getIsValidUser from './server/lib/get_is_valid_user';
import getValidate from './server/lib/get_validate';
import getCalculateExpires from './server/lib/get_calculate_expires';
import initAuthenticateApi from './server/routes/api/v1/authenticate';
import initUsersApi from './server/routes/api/v1/users';
import initRolesApi from './server/routes/api/v1/roles';
import initLoginView from './server/routes/views/login';
import initLogoutView from './server/routes/views/logout';
import validateConfig from './server/lib/validate_config';

export default (kibana) => new kibana.Plugin({
  id: 'shield',
  configPrefix: 'xpack.shield',
  require: ['elasticsearch'],
  publicDir: join(__dirname, 'public'),

  config(Joi) {
    return Joi.object({
      enabled: Joi.boolean().default(true),
      cookieName: Joi.string().default('sid'),
      encryptionKey: Joi.string(),
      sessionTimeout: Joi.number().default(30 * 60 * 1000),
      // Only use this if SSL is still configured, but it's configured outside of the Kibana server
      // (e.g. SSL is configured on a load balancer)
      skipSslCheck: Joi.boolean().default(false)
    }).default();
  },

  uiExports: {
    chromeNavControls: ['plugins/shield/views/logout_button'],
    apps: [{
      id: 'login',
      title: 'Login',
      main: 'plugins/shield/views/login',
      hidden: true
    }, {
      id: 'logout',
      title: 'Logout',
      main: 'plugins/shield/views/logout',
      hidden: true
    }]
  },

  init(server, options) {
    const config = server.config();
    validateConfig(config);

    server.register(hapiAuthCookie, (error) => {
      if (error != null) throw error;

      server.auth.strategy('session', 'cookie', 'required', {
        cookie: config.get('xpack.shield.cookieName'),
        password: config.get('xpack.shield.encryptionKey'),
        path: config.get('server.basePath') + '/',
        clearInvalid: true,
        redirectTo: `${config.get('server.basePath')}/login`,
        appendNext: true,
        validateFunc: getValidate(server)
      });
    });

    basicAuth.register(server, config.get('xpack.shield.cookieName'), getIsValidUser(server), getCalculateExpires(server));

    initAuthenticateApi(server);
    initUsersApi(server);
    initRolesApi(server);
    initLoginView(server, this);
    initLogoutView(server, this);
  }
});
