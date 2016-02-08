/**
 * Controller for Overview Page
 */
const mod = require('ui/modules').get('monitoring', [ 'monitoring/directives' ]);
const _ = require('lodash');

function getPageData(timefilter, globalState, $http, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster}`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    metrics: [
      'cluster_search_request_rate',
      'cluster_query_latency',
      'cluster_index_request_rate',
      'cluster_index_latency'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));
    return ajaxErrorHandlers.fatalError(err);
  });
}

require('ui/routes')
.when('/overview', {
  template: require('plugins/monitoring/views/overview/overview_template.html'),
  resolve: {
    monitoring: function (Private) {
      const routeInit = Private(require('plugins/monitoring/lib/route_init'));
      return routeInit();
    },
    pageData: getPageData
  }
});

mod.controller('overview', ($route, globalState, timefilter, $http, Private, $executor, monitoringClusters, $scope) => {

  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster });
  }
  setClusters($route.current.locals.monitoring.clusters);

  $scope.pageData = $route.current.locals.pageData;

  var docTitle = Private(require('ui/doc_title'));
  docTitle.change(`Monitoring - ${$scope.cluster.cluster_name}`, true);

  $executor.register({
    execute: () => getPageData(timefilter, globalState, $http, Private),
    handleResponse: (response) => $scope.pageData = response
  });

  $executor.register({
    execute: () => monitoringClusters.fetch(),
    handleResponse: setClusters
  });


  // Start the executor
  $executor.start();

  // Destory the executor
  $scope.$on('$destroy', $executor.destroy);

});

