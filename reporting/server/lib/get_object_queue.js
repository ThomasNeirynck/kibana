const _ = require('lodash');
module.exports = (server) => {
  const client = server.plugins.reporting.client;
  const config = server.config();

  // init saved objects module
  const requestConfig = _.defaults(config.get('reporting.kibanaServer'), {
    'kibanaApp': config.get('server.basePath') + config.get('reporting.kibanaApp'),
    'kibanaIndex': config.get('kibana.index'),
    'protocol': server.info.protocol,
    'hostname': config.get('server.host'),
    'port': config.get('server.port'),
  });

  const savedObjects = require('../lib/saved_objects')(client, requestConfig);

  return function getObjectQueue(type, objId) {
    if (type === 'dashboard') {
      return savedObjects.get(type, objId, [ 'panelsJSON'])
      .then(function (savedObj) {
        const fields = ['id', 'type', 'panelIndex'];
        const panels = JSON.parse(savedObj.panelsJSON);

        return panels.map((panel) => savedObjects.get(panel.type, panel.id));
      });
    }

    return Promise.resolve([ savedObjects.get(type, objId) ]);
  };
};
