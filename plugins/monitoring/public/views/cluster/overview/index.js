import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from './index.html';

uiRoutes.when('/overview', {
  template,
  resolve: {
    clusters(Private) {
      // checks license info of all monitored clusters for multi-cluster monitoring usage and capability
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    cluster(monitoringClusters, globalState) {
      return monitoringClusters(globalState.cluster_uuid);
    }
  }
});

const uiModule = uiModules.get('monitoring', ['monitoring/directives']);
uiModule.controller('overview', ($scope, $route, monitoringClusters, timefilter, title, globalState, $executor) => {
  timefilter.enabled = true;

  $scope.cluster = $route.current.locals.cluster;

  title($scope.cluster, 'Overview');

  $executor.register({
    execute: () => monitoringClusters(globalState.cluster_uuid),
    handleResponse(cluster) {
      $scope.cluster = cluster;
    }
  });

  $executor.start();

  $scope.$on('$destroy', $executor.destroy);
});
