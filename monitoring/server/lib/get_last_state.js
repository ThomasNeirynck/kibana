const _ = require('lodash');
const createQuery = require('./create_query.js');

module.exports = (req, indices) => {
  const callWithRequest = req.server.plugins.elasticsearch.callWithRequest;
  const end = req.payload.timeRange.max;
  const clusterUuid = req.params.clusterUuid;
  const config = req.server.config();
  const resolver = config.get('monitoring.node_resolver');

  const params = {
    index: indices,
    meta: 'get_last_state',
    type: 'cluster_state',
    ignore: [404],
    body: {
      size: 1,
      sort: { timestamp: { order: 'desc' } },
      query: createQuery({ end, clusterUuid })
    }
  };

  return callWithRequest(req, 'search', params)
  .then(resp => {
    const total = _.get(resp, 'hits.total', 0);
    if (!total) {
      // time frame is out of bounds with indexed data
      return {
        cluster_state: {
          state_uuid: 'devnull',
          nodes: {}
        }
      };
    }
    const lastState = _.get(resp, 'hits.hits[0]._source');
    const nodes = _.get(lastState, 'cluster_state.nodes');
    if (nodes) {
      // re-key the nodes objects to use resolver
      lastState.cluster_state.nodes = _.indexBy(nodes, node => node[resolver]);
    }
    return lastState;
  });
};
