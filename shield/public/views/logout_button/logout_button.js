require('ui/registry/chrome_nav_controls').register(function () {
  return {
    name: 'logout button',
    order: 1000,
    template: require('plugins/shield/views/logout_button/logout_button.html')
  };
});