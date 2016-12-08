import _ from 'lodash';
import routes from 'ui/routes';
import template from 'plugins/security/views/management/edit_user.html';
import 'angular-resource';
import 'angular-ui-select';
import 'plugins/security/services/shield_user';
import 'plugins/security/services/shield_role';
import checkLicenseError from 'plugins/security/lib/check_license_error';

routes.when('/management/elasticsearch/users/edit/:username?', {
  template,
  resolve: {
    me(ShieldUser) {
      return ShieldUser.getCurrent();
    },
    user($route, ShieldUser, kbnUrl, Promise, Notifier) {
      const username = $route.current.params.username;
      if (username != null) {
        return ShieldUser.get({username}).$promise
        .catch((response) => {
          const notifier = new Notifier();
          if (response.status !== 404) return notifier.fatal(response);
          notifier.error(`No "${username}" user found.`);
          kbnUrl.redirect('/management/elasticsearch/users');
          return Promise.halt();
        });
      }
      return new ShieldUser({roles: []});
    },
    roles(ShieldRole, kbnUrl, Promise, Private) {
      // $promise is used here because the result is an ngResource, not a promise itself
      return ShieldRole.query().$promise
      .then((roles) => _.map(roles, 'name'))
      .catch(checkLicenseError(kbnUrl, Promise, Private));
    }
  },
  controllerAs: 'editUser',
  controller($scope, $route, kbnUrl, ShieldUser, Notifier) {
    $scope.me = $route.current.locals.me;
    $scope.user = $route.current.locals.user;
    $scope.availableRoles = $route.current.locals.roles;

    this.isNewUser = $route.current.params.username == null;

    const notifier = new Notifier();

    $scope.deleteUser = (user) => {
      if (!confirm('Are you sure you want to delete this user? This action is irreversible!')) return;
      user.$delete()
      .then(() => notifier.info('The user has been deleted.'))
      .then($scope.goToUserList)
      .catch(error => notifier.error(_.get(error, 'data.message')));
    };

    $scope.saveUser = (user) => {
      // newPassword is unexepcted by the API.
      delete user.newPassword;
      user.$save()
      .then(() => notifier.info('The user has been updated.'))
      .then($scope.goToUserList)
      .catch(error => notifier.error(_.get(error, 'data.message')));
    };

    $scope.goToUserList = () => {
      kbnUrl.redirect('/management/elasticsearch/users');
    };

    $scope.saveNewPassword = (newPassword, currentPassword, onSuccess, onIncorrectPassword) => {
      $scope.user.newPassword = newPassword;
      if (currentPassword) {
        // If the currentPassword is null, we shouldn't send it.
        $scope.user.password = currentPassword;
      }

      $scope.user.$changePassword()
      .then(() => notifier.info('The password has been changed.'))
      .then(onSuccess)
      .catch(error => {
        if (error.status === 401) {
          onIncorrectPassword();
        }
        else notifier.error(_.get(error, 'data.message'));
      });
    };
  }
});
