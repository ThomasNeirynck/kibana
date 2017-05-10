const getPlugins = require('./get_plugins');

/*
 * Note: The path `plugins / pluginName / ** / __tests__ / ** / *.js` will match
 * all public and server tests, so a special var must be used for "index" tests
 * paths: `plugins / pluginName / __tests__ / ** / *.js`
 */
function getPluginPaths(plugins, opts = {}) {
  const testPath = opts.tests ? '__tests__/**' : '';

  return plugins.reduce((paths, pluginName) => {
    const plugin = pluginName.trim();
    const commonPath = `${plugin}/common`;
    const serverPath = `${plugin}/**/server`;
    const publicPath = `${plugin}/**/public`;

    const indexPaths = `plugins/${plugin}/${testPath}/*.js`; // index and helpers
    const commonPaths = `plugins/${commonPath}/**/${testPath}/*.js`;
    const serverPaths = `plugins/${serverPath}/**/${testPath}/*.js`;
    const publicPaths = `plugins/${publicPath}/**/${testPath}/*.js`;

    paths = paths.concat([indexPaths, commonPaths, serverPaths]);

    if (opts.browser) {
      paths = paths.concat(publicPaths);
    }

    return paths;
  }, []);
}

exports.forPlugins = function () {
  const plugins = getPlugins();
  return getPluginPaths(plugins, { browser: true });
};

exports.forPluginServerTests = function () {
  const plugins = getPlugins();
  return getPluginPaths(plugins, { tests: true });
};
