define(function (require) {
  var _ = require('lodash');
  var chrome = require('ui/chrome');
  var tabs = require('./tabs');
  return function routeInitProvider(Notifier, monitoringSettings, Private, monitoringClusters, globalState, Promise, kbnUrl) {

    var initMonitoringIndex = Private(require('plugins/monitoring/lib/monitoring_index_init'));
    var phoneHome = Private(require('plugins/monitoring/lib/phone_home'));
    var ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));
    return function (options) {
      options = _.defaults(options || {}, {
        force: {
          settings: true
        }
      });

      var monitoring = {};
      var notify = new Notifier({ location: 'Monitoring' });
      return monitoringClusters.fetch(true)
        .then(function (clusters) {
          return phoneHome.sendIfDue(clusters).then(() => {
            return clusters;
          });
        })
        // Get the clusters
        .then(function (clusters) {
          var cluster;
          monitoring.clusters = clusters;
          // Check to see if the current cluster is available
          if (globalState.cluster && !_.find(clusters, { cluster_uuid: globalState.cluster })) {
            globalState.cluster = null;
          }
          // if there are no clusers choosen then set the first one
          if (!globalState.cluster) {
            cluster = _.first(clusters);
            if (cluster && cluster.cluster_uuid) {
              globalState.cluster = cluster.cluster_uuid;
              globalState.save();
            }
          }
          // if we don't have any clusters then redirect to setup
          if (!globalState.cluster) {
            notify.error('We can\'t seem to find any clusters in your Monitoring data. Please check your Monitoring agents');
            return kbnUrl.redirect('/home');
          }
          return globalState.cluster;
        })
        // Get the Monitoring Settings
        .then(function (cluster) {
          return monitoringSettings.fetch(cluster, options.force.settings)
            .then(function (settings) {
              monitoring.settings = settings;
              return settings;
            });
        })
        // Get the Monitoring Index Pattern
        .then(function (settings) {
          return initMonitoringIndex().then(function (indexPattern) {
            monitoring.indexPattern = indexPattern;
            return indexPattern;
          });
        })
        // Finally filter the cluster from the nav if it's light then return the Monitoring object.
        .then(function () {
          var cluster = _.find(monitoring.clusters, { cluster_uuid: globalState.cluster });
          var license = cluster.license;
          var isExpired = (new Date()).getTime() > license.expiry_date_in_millis;

          if (isExpired && !_.contains(window.location.hash, 'license')) {
            // redirect to license, but avoid infinite loop
            kbnUrl.redirect('license');
          } else {
            chrome.setTabs(tabs.filter(function (tab) {
              if (tab.id !== 'home') return true;
              if (license.type !== 'basic') return true;
              return false;
            }));
          }
          return monitoring;
        })
        .catch(ajaxErrorHandlers.fatalError);
    };
  };
});
