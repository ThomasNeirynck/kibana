const publicRoutes = require('./server/routes/public');
const fileRoutes = require('./server/routes/file');
const phantom = require('./server/lib/phantom');
const generatePDFStream = require('./server/lib/generate_pdf_stream');
const config = require('./server/config/config');
const checkLicense = require('./server/lib/check_license');

module.exports = function (kibana) {
  return new kibana.Plugin({
    name: 'reporting',
    require: ['kibana', 'elasticsearch'],

    uiExports: {
      navbarExtensions: [
        'plugins/reporting/controls/discover',
        'plugins/reporting/controls/visualize',
        'plugins/reporting/controls/dashboard',
      ],
      injectDefaultVars: function (server, options) {
        const checker = checkLicense(server.plugins.elasticsearch.client);

        function registerVars(enabled) {
          server.expose('enabled', enabled);

          return {
            reportingEnabled: enabled
          };
        }

        return checker.check()
        .then((check) => {
          server.log(['reporting', 'license', 'debug'], `License check: ${check.message}`);
          registerVars(check.enabled);
        })
        .catch((err) => registerVars(false));
      },
    },

    config: config,

    init: function (server, options) {
      // init the plugin helpers
      const plugin = this;
      const config = server.config();

      function setup() {
        // prepare phantom binary
        return phantom.install()
        .then(function (binaryPath) {
          server.log(['reporting', 'debug'], `Phantom installed at ${binaryPath}`);

          // expose internal assets
          server.expose('generatePDFStream', generatePDFStream(server));

          // Reporting routes
          publicRoutes(server);
          fileRoutes(server);
        })
        .catch(function (err) {
          return plugin.status.red(err.message);
        });
      }

      if (!server.plugins.reporting.enabled) {
        server.log(['warning', 'reporting'], 'Reporting is disabled. Please check your license.');
        return;
      }

      return setup();
    }
  });
};
