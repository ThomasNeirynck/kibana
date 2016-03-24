import chrome from 'ui/chrome';

chrome
.setVisible(false)
.setRootController('logout', ($http) => {
  $http.post('./api/security/v1/logout', {}).then(
    (response) => window.location.href = './login'
  );
});
