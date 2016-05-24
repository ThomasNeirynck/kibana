const url = require('url');
const chrome = require('ui/chrome');

const mainEntry = '/api/reporting/generate';
const reportPrefix = chrome.addBasePath(mainEntry);

module.exports = function urlInfo($location) {
  const docTypes = {
    discover: {
      getParams: (path) => path.match(/\/discover\/(.+)/),
      getReportUrl: (name, query) => `${reportPrefix}/search/${name}?${query}`,
    },
    visualize: {
      getParams: (path) => path.match(/\/visualize\/edit\/(.+)/),
      getReportUrl: (name, query) => `${reportPrefix}/visualization/${name}?${query}`,
    },
    dashboard: {
      getParams: (path) => path.match(/\/dashboard\/(.+)/),
      getReportUrl: (name, query) => `${reportPrefix}/dashboard/${name}?${query}`,
    },
  };

  function parseFromUrl() {
    const { pathname, query } = url.parse($location.$$url, false);
    const pathParams = pathname.match(/\/([a-z]+)?(\/?.*)/);

    const type = pathParams[1];
    const docType = docTypes[type];
    if (!docType) throw new Error('Invalid app type: ' + type);

    const params = docType.getParams(pathname);
    const exportable = (!!params);
    const objectId = (exportable) ? params[1] : null;
    const reportUrl = (exportable) ? docType.getReportUrl(objectId, query) : null;

    return {
      pathname,
      query,
      reportUrl,
      objectId,
      exportable,
    };
  }

  return parseFromUrl;
};
