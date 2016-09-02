import chrome from 'ui/chrome';

export default function PathProvider($window) {
  const path = chrome.removeBasePath($window.location.pathname);
  return {
    get() {
      return path;
    },
    isLoginOrLogout() {
      return path === '/login' || path === '/logout';
    }
  };
}
