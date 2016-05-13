import {includes, negate} from 'lodash';
import routes from 'ui/routes';
import {toggle, toggleSort} from 'plugins/security/lib/util';
import template from 'plugins/security/views/settings/roles.html';
import 'plugins/security/services/shield_role';

routes.when('/settings/security/roles', {
  template,
  resolve: {
    roles(ShieldRole) {
      return ShieldRole.query();
    }
  },
  controller($scope, $route, $q, Notifier) {
    $scope.roles = $route.current.locals.roles;
    $scope.selectedRoles = [];
    $scope.sort = {orderBy: 'name', reverse: false};

    const notifier = new Notifier();

    $scope.deleteRoles = () => {
      if (!confirm(`Are you sure you want to delete the selected role(s)? This action is irreversible!`)) return;
      $q.all($scope.selectedRoles.map((role) => role.$delete()))
      .then(() => notifier.info('The role(s) have been deleted.'))
      .then(() => {
        $scope.selectedRoles.map((role) => {
          const i = $scope.roles.indexOf(role);
          $scope.roles.splice(i, 1);
        });
        $scope.selectedRoles.length = 0;
      });
    };

    $scope.toggleAll = () => {
      if ($scope.allSelected()) {
        $scope.selectedRoles.length = 0;
      } else {
        $scope.selectedRoles = getActionableRoles().slice();
      }
    };

    $scope.allSelected = () => {
      const roles = getActionableRoles();
      return roles.length && roles.length === $scope.selectedRoles.length;
    };

    $scope.isReservedRole = (role) => ['superuser', 'transport_client'].indexOf(role.name) >= 0;

    $scope.toggle = toggle;
    $scope.includes = includes;
    $scope.toggleSort = toggleSort;

    function getActionableRoles() {
      return $scope.roles.filter(negate($scope.isReservedRole));
    }
  }
});
