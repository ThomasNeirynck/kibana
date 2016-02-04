const publicRoutes = require('./server/routes/public');
const fileRoutes = require('./server/routes/file');
const createClient = require('./server/lib/create_client');
const phantom = require('./server/lib/phantom');
const generatePDFStream = require('./server/lib/generate_pdf_stream');

module.exports = function (kibana) {
  return new kibana.Plugin({
    name: 'reporting',
    require: ['kibana', 'elasticsearch'],

    uiExports: {
      navbarExtensions: [
        'plugins/reporting/controls/discover',
        'plugins/reporting/controls/visualize',
        'plugins/reporting/controls/dashboard',
      ]
    },

    config: function (Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        kibanaApp: Joi.string().regex(/^\//).default('/app/kibana'),
        kibanaServer: Joi.object({
          protocol: Joi.string().valid(['http', 'https']),
          hostname: Joi.string(),
          port: Joi.number().integer()
        }).default(),
        auth: Joi.object({
          username: Joi.string(),
          password: Joi.string()
        }).default(),
        phantom: Joi.object({
          zoom: Joi.number().integer().default(1),
          viewport: Joi.object({
            width: Joi.number().integer().default(1320),
            height: Joi.number().integer().default(640)
          }).default(),
          timeout: Joi.number().integer().default(6000),
          loadDelay: Joi.number().integer().default(3000)
        }).default(),
        workingDir: Joi.string().default('.tmp')
      }).default();
    },

    init: function (server, options) {
      // init the plugin helpers
      const plugin = this;
      const config = server.config();

      server.plugins.elasticsearch.status.on('green', () => {
        // create ES client instance for reporting, expose on server
        const client = createClient(server.plugins.elasticsearch, {
          username: config.get('reporting.auth.username'),
          password: config.get('reporting.auth.password'),
        });
        server.expose('client', client);
        server.expose('generatePDFStream', generatePDFStream(server));

        // make sure we can communicate with ES
        function checkESComm() {
          client.checkConnection()
          .then(() => plugin.status.green())
          .catch((err) => plugin.status.red(err.message));
        };
        checkESComm();
        setInterval(checkESComm, 2000);
      });

      // prepare phantom binary
      return phantom.install()
      .then(function () {
        // Reporting routes
        publicRoutes(server);
        fileRoutes(server);
      })
      .catch(function (err) {
        return plugin.status.red(err.message);
      });
    }
  });
};
