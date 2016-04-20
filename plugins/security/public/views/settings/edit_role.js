import _ from 'lodash';
import routes from 'ui/routes';
import {toggle} from 'plugins/security/lib/util';
import template from 'plugins/security/views/settings/edit_role.html';
import 'angular-ui-select';
import 'plugins/security/services/shield_user';
import 'plugins/security/services/shield_role';
import 'plugins/security/services/shield_privileges';
import 'plugins/security/services/shield_indices';

routes.when('/settings/security/roles/edit/:name?', {
  template,
  resolve: {
    role($route, ShieldRole) {
      const name = $route.current.params.name;
      if (name != null) return ShieldRole.get({name});
      return new ShieldRole({
        cluster: [],
        indices: [],
        run_as: []
      });
    },
    users(ShieldUser) {
      return ShieldUser.query().$promise.then(users => _.map(users, 'username'));
    },
    indexPatterns(shieldIndices) {
      return shieldIndices.getIndexPatterns();
    }
  },
  controller($scope, $route, $location, shieldPrivileges, shieldIndices, Notifier) {
    $scope.role = $route.current.locals.role;
    $scope.users = $route.current.locals.users;
    $scope.indexPatterns = $route.current.locals.indexPatterns;
    $scope.privileges = shieldPrivileges;
    $scope.view = {
      isNewRole: $route.current.params.name == null,
      isReservedRole: ['superuser', 'transport_client'].indexOf($route.current.params.name) >= 0,
      newIndex: {names: [], privileges: [], fields: []},
      fieldOptions: []
    };

    const notifier = new Notifier();

    $scope.deleteRole = (role) => {
      if (!confirm('Are you sure you want to delete this role? This action is irreversible!')) return;
      role.$delete()
      .then(() => notifier.info('The role has been deleted.'))
      .then($scope.goToRoleList)
      .catch(error => notifier.error(_.get(error, 'data.message')));
    };

    $scope.saveRole = (role) => {
      role.$save()
      .then(() => notifier.info('The role has been updated.'))
      .then($scope.goToRoleList)
      .catch(error => notifier.error(_.get(error, 'data.message')));
    };

    $scope.goToRoleList = () => {
      $location.path('/settings/security/roles');
    };

    $scope.addIndex = (indices, index) => {
      indices.push(_.cloneDeep(index));
      index.names.length = 0;
    };

    $scope.getFields = (index, i) => {
      return shieldIndices.getFields(index.names.join(','))
      .then((fields) => $scope.view.fieldOptions[i] = fields)
      .catch(() => $scope.view.fieldOptions[i] = []);
    };

    $scope.$watch('role.indices.length', () => {
      _.map($scope.role.indices, (index, i) => $scope.getFields(index, i));
    });

    $scope.toggle = toggle;
    $scope.includes = _.includes;
    $scope.union = _.flow(_.union, _.compact);

    $scope.areIndicesValid = (indices) => {
      return indices.find((index) => index.privileges.length === 0) == null;
    };
  }
});
