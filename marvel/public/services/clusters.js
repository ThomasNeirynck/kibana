define(function (require) {
  var _ = require('lodash');
  var angular = require('angular');
  require('angular-resource');

  var module = require('ui/modules').get('monitoring/clusters', [ 'ngResource' ]);
  module.service('monitoringClusters', function ($resource, Promise, Private) {

    // always use relative paths for endpoints, because absolute will break any reverse proxying
    var Clusters = $resource('../api/monitoring/v1/clusters/:id', { id: '@cluster_uuid' });
    var cache;

    function fetch() {
      return Clusters.query().$promise
      .then(function (clusters) {
        return clusters;
      })
      .catch(function (err) {
        var ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));
        return ajaxErrorHandlers.fatalError(err);
      });
    }

    return { fetch: fetch };

  });
});
