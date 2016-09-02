import _ from 'lodash';
import uiModules from 'ui/modules';
import 'plugins/security/services/login_page';
import 'plugins/security/services/auto_logout';

const module = uiModules.get('security', []);
module.config(($httpProvider) => {
  $httpProvider.interceptors.push(($timeout, $window, $q, $injector, sessionTimeout, Notifier, LoginPage, autoLogout) => {
    const notifier = new Notifier();
    const notificationLifetime = 60 * 1000;
    const notificationOptions = {
      type: 'warning',
      content: 'You will soon be logged out due to inactivity. Click OK to resume.',
      icon: 'warning',
      title: 'Warning',
      lifetime: Math.min(sessionTimeout, notificationLifetime),
      actions: ['accept']
    };

    let pendingNotification;
    let activeNotification;

    function clearNotifications() {
      if (pendingNotification) $timeout.cancel(pendingNotification);
      if (activeNotification) activeNotification.clear();
    }

    function scheduleNotification() {
      pendingNotification = $timeout(showNotification, Math.max(sessionTimeout - notificationLifetime, 0));
    }

    function showNotification() {
      activeNotification = notifier.add(notificationOptions, (action) => {
        if (action === 'accept') {
          // Make a simple request to keep the session alive
          $injector.get('es').ping();
        } else {
          autoLogout();
        }
      });
    }

    function interceptorFactory(responseHandler) {
      return function interceptor(response) {
        if (!LoginPage.isOnLoginPage()) {
          clearNotifications();
          scheduleNotification();
        }
        return responseHandler(response);
      };
    }

    return {
      response: interceptorFactory(_.identity),
      responseError: interceptorFactory($q.reject)
    };
  });
});
