/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2016 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

import initializationChecks from './lib/initialization_checks';
import { resolve } from 'path';
import Boom from 'boom';
import { checkLicense } from './server/lib/check_license';
import mirrorPluginStatus from '../../server/lib/mirror_plugin_status';
const jobRoutes = require('./server/routes/anomaly_detectors');
const dataFeedRoutes = require('./server/routes/datafeeds');
const systemRoutes = require('./server/routes/system');

module.exports = function (kibana) {

  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch', 'xpack_main'],
    id: 'ml',
    configPrefix: 'xpack.ml',
    publicDir: resolve(__dirname, 'public'),

    uiExports: {
      app: {
        title: 'Machine Learning',
        description: 'Elastic behavioral analytics for machine data',
        icon: 'plugins/ml/ml.svg',
        main: 'plugins/ml/app',
        uses: [
          'visTypes',
          'spyModes'
        ],
        injectVars: function (server) {
          const config = server.config();

          // tilemapsConfig settings are still needed even though the plugin
          // doesn't use Tilemap directly.
          // DEPRECATED SETTINGS
          // if the url is set, the old settings must be used.
          // keeping this logic for backward compatibilty.
          const configuredUrl = server.config().get('tilemap.url');
          const isOverridden = typeof configuredUrl === 'string' && configuredUrl !== '';
          const tilemapConfig = config.get('tilemap');
          return {
            kbnIndex: config.get('kibana.index'),
            tilemapsConfig: {
              deprecated: {
                isOverridden: isOverridden,
                config: tilemapConfig,
              },
              manifestServiceUrl: config.get('tilemap.manifestServiceUrl')
            },
            esServerUrl: config.get('elasticsearch.url'),
          };
        }
      },
      visTypes: [
        'plugins/ml/ml_vis_types'
      ],
      hacks: ['plugins/ml/hacks/toggle_app_link_in_nav'],
    },


    init: function (server) {
      const thisPlugin = this;
      const xpackMainPlugin = server.plugins.xpack_main;
      mirrorPluginStatus(xpackMainPlugin, thisPlugin);
      xpackMainPlugin.status.once('green', () => {
        // Register a function that is called whenever the xpack info changes,
        // to re-compute the license check results for this plugin
        xpackMainPlugin.info.feature(thisPlugin.id).registerLicenseCheckResultsGenerator(checkLicense);
      });

      // Add server routes and initalize the plugin here
      const commonRouteConfig = {
        pre: [
          function forbidApiAccess(request, reply) {
            const licenseCheckResults = xpackMainPlugin.info.feature(thisPlugin.id).getLicenseCheckResults();
            if (licenseCheckResults.isAvailable) {
              reply();
            } else {
              reply(Boom.forbidden(licenseCheckResults.message));
            }
          }
        ]
      };

      jobRoutes(server, commonRouteConfig);
      dataFeedRoutes(server, commonRouteConfig);
      systemRoutes(server, commonRouteConfig);

      initializationChecks(this, server).start();
    }


  });
};
