import 'ui/autoload/styles';
import 'plugins/security/views/login/login.less';
import kibanaLogoUrl from 'plugins/security/images/kibana.svg';
import chrome from 'ui/chrome';
import template from 'plugins/security/views/login/login.html';

chrome
.setVisible(false)
.setRootTemplate(template)
.setRootController('login', ($http) => {
  const {search, hash} = location;
  const index = search.indexOf('?next=');
  const next = index < 0 ? '/' : decodeURIComponent(search.substr(index + '?next='.length)) + hash;

  return {
    kibanaLogoUrl,
    submit(username, password) {
      $http.post('./api/security/v1/login', {username, password}).then(
        (response) => window.location.href = `.${next}`,
        (error) => this.error = true
      );
    }
  };
});
