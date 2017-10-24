import { resolve } from 'path';
import { has } from 'lodash';
import { mirrorPluginStatus } from '../../server/lib/mirror_plugin_status';
import { main as mainRoutes } from './server/routes/main';
import { jobs as jobRoutes } from './server/routes/jobs';

import { createQueueFactory } from './server/lib/create_queue';
import { config as appConfig } from './server/config/config';
import { checkLicenseFactory } from './server/lib/check_license';
import { validateConfig } from './server/lib/validate_config';
import { createExportTypesRegistryFactory } from './server/lib/create_export_types_registry';

export const reporting = (kibana) => {
  return new kibana.Plugin({
    id: 'reporting',
    configPrefix: 'xpack.reporting',
    publicDir: resolve(__dirname, 'public'),
    require: ['kibana', 'elasticsearch', 'xpack_main'],

    uiExports: {
      navbarExtensions: [
        'plugins/reporting/controls/discover',
        'plugins/reporting/controls/visualize',
        'plugins/reporting/controls/dashboard',
      ],
      hacks: [ 'plugins/reporting/hacks/job_completion_notifier'],
      managementSections: ['plugins/reporting/views/management'],
      injectDefaultVars(server, options) {
        return {
          reportingPollConfig: options.poll
        };
      }
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
        queue: Joi.object({
          indexInterval: Joi.string().default('week'),
          pollInterval: Joi.number().integer().default(3000),
          pollIntervalErrorMultiplier: Joi.number().integer().default(10),
          timeout: Joi.number().integer().default(30000),
        }).default(),
        capture: Joi.object({
          record: Joi.boolean().default(false),
          zoom: Joi.number().integer().default(2),
          viewport: Joi.object({
            width: Joi.number().integer().default(1950),
            height: Joi.number().integer().default(1200)
          }).default(),
          timeout: Joi.number().integer().default(20000),
          loadDelay: Joi.number().integer().default(3000),
          settleTime: Joi.number().integer().default(1000),
          concurrency: Joi.number().integer().default(appConfig.concurrency),
          browser: Joi.object({
            type: Joi.any().valid('phantom', 'chromium').default('phantom'),
            chromium: Joi.object({
              disableSandbox: Joi.boolean().default(false)
            }).default()
          }).default()
        }).default(),
        csv: Joi.object({
          maxSizeBytes: Joi.number().integer().default(1024 * 1024 * 10), // bytes in a kB * kB in a mB * 10
          scroll: Joi.object({
            duration: Joi.string().regex(/^[0-9]+(d|h|m|s|ms|micros|nanos)$/, { name: 'DurationString' }).default('30s'),
            size: Joi.number().integer().default(500)
          }).default(),
        }).default(),
        encryptionKey: Joi.string(),
        roles: Joi.object({
          allow: Joi.array().items(Joi.string()).default(['reporting_user']),
        }).default(),
        index: Joi.string().default('.reporting'),
        poll: Joi.object({
          jobCompletionNotifier: Joi.object({
            interval: Joi.number().integer().default(10000),
            intervalErrorMultiplier: Joi.number().integer().default(5)
          }).default(),
          jobsRefresh: Joi.object({
            interval: Joi.number().integer().default(5000),
            intervalErrorMultiplier: Joi.number().integer().default(5)
          }).default(),
        }).default(),
      }).default();
    },

    init: async function (server) {
      const createExportTypesRegistry = createExportTypesRegistryFactory(server);
      const exportTypesRegistry = await createExportTypesRegistry(resolve(__dirname, './export_types/*/server/index.js'));
      server.expose('exportTypesRegistry', exportTypesRegistry);

      const config = server.config();
      validateConfig(config, message => server.log(['reporting', 'warning'], message));

      const xpackMainPlugin = server.plugins.xpack_main;
      mirrorPluginStatus(xpackMainPlugin, this);
      const checkLicense = checkLicenseFactory(exportTypesRegistry);
      xpackMainPlugin.status.once('green', () => {
        // Register a function that is called whenever the xpack info changes,
        // to re-compute the license check results for this plugin
        xpackMainPlugin.info.feature(this.id).registerLicenseCheckResultsGenerator(checkLicense);
      });


      for(const exportType of exportTypesRegistry.getAll()) {
        if (exportType.initFactory) {
          const result = await exportType.initFactory(server)();
          if (!result.success) {
            this.status.red(result.message);
          }
        }
      }

      server.expose('queue', createQueueFactory(server));

      // Reporting routes
      mainRoutes(server);
      jobRoutes(server);
    },

    deprecations: function () {
      return [
        (settings, log) => {
          if (has(settings, 'capture.concurrency')) {
            log('Config key "capture.concurrency" is no longer used and is now deprecated. It can be removed entirely.');
          }

          if (has(settings, 'capture.timeout')) {
            log('Config key "capture.timeout" is no longer used and is now deprecated. It can be removed entirely.');
          }
        }
      ];
    },
  });
};
