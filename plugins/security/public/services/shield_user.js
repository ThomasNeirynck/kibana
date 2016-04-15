import 'angular-resource';
import uiModules from 'ui/modules';

const module = uiModules.get('shield', ['ngResource']);
module.service('ShieldUser', ($resource, $http) => {
  const ShieldUser = $resource('../api/security/v1/users/:username', {
    username: '@username'
  });

  ShieldUser.changePassword = (user) => {
    const password = user.password;
    return $http.post(`../api/security/v1/users/${user.username}/password`, {password});
  };

  return ShieldUser;
});
