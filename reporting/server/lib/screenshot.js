const path = require('path');
const _ = require('lodash');
const Horseman = require('node-horseman');
const phantomPath = require('./phantom').getPath();
const debug = require('./logger');

module.exports = function (phantomSettings, workingDir) {
  return {
    capture: capture,
  };

  function capture(url, opts) {
    opts = opts || {};
    const filepath = getFilepath(opts.filename);
    const ph = fetch(url, opts);

    return ph.then(function () {
      return (opts.bounding)
        ? shotCropped(ph, opts.bounding, filepath)
        : shot(ph, filepath);
    })
    .then(function () {
      return filepath;
    })
    .catch(function (err) {
      debug('screenshot failed', err.message);
      throw err;
    })
    .close();
  }

  function fetch(url, opts) {
    const { loadDelay, viewport } = phantomSettings;
    const phantomOpts = {
      phantomPath: phantomPath,
      injectJquery: false,
      timeout: 10000,
    };

    debug('fetching screenshot of %s', url);

    const ph = new Horseman(phantomOpts)
    .viewport(viewport.width, viewport.height)
    .zoom(phantomSettings.zoom);

    return ph.then(function () {
      if (opts.headers) {
        debug('Setting headers', opts.headers);
        return ph.headers(opts.headers);
      }
    })
    .open(url)
    .then(function (status) {
      debug('url open status:', status, url);
      if (status !== 'success') throw new Error('URL open failed. Is the server running?');
    })
    .wait('.application visualize')
    .wait(loadDelay);
  };

  function getFilepath(filename) {
    if (!filename) {
      const ts = new Date().getTime();
      filename = 'screenshot-' + ts + '.png';
    }
    const outputDir = path.resolve(__dirname, '..', '..', workingDir);
    return path.join(outputDir, filename);
  }

  function shot(ph, filepath) {
    return ph.screenshot(filepath)
    .then(function () {
      debug('screenshot saved to %s', filepath);
    });
  }

  // cropped screenshot using DOM element or getBoundingClientRect
  // see https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
  function shotCropped(ph, bounding, filepath) {
    const viewport = phantomSettings.viewport;
    const contentOffset = _.defaults({}, bounding, {
      top: 90, // top chrome
      left: 0,
      right: 0,
      bottom: 0,
    });

    const boundingArea = _.defaults(contentOffset, {
      width: viewport.width - contentOffset.left - contentOffset.right,
      height: viewport.height - contentOffset.top - contentOffset.bottom,
    });

    return ph.crop(boundingArea, filepath)
    .then(function () {
      debug('cropped screenshot saved to %s', filepath);
    });
  }
};
