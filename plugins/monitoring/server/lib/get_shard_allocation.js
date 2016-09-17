import _ from 'lodash';
import createQuery from './create_query';
import { ElasticsearchMetric } from './metrics/metric_classes';

export default function getShardAllocation(req, _indices, filters, lastState, showSystemIndices = false) {
  filters.push({
    term: { state_uuid: _.get(lastState, 'cluster_state.state_uuid') }
  });

  if (!showSystemIndices) {
    filters.push({
      bool: { must_not: [
        { prefix: { 'shard.index': '.' } }
      ] }
    });
  }


  const config = req.server.config();
  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const uuid = req.params.clusterUuid;
  const metric = ElasticsearchMetric.getMetricFields();
  const params = {
    /* TODO It would be more efficient to use the indices param instead of
    * wildcard. Needs testing to ensure the time range the indices cover always
    * has the last data from the cluster state. */
    index: config.get('xpack.monitoring.elasticsearch.index_pattern'),
    type: 'shards',
    body: {
      size: config.get('xpack.monitoring.max_bucket_size'),
      query: createQuery({ uuid, metric, filters })
    }
  };

  return callWithRequest(req, 'search', params)
  .then((resp) => {
    const hits = _.get(resp, 'hits.hits');
    if (!hits) return [];
    // map into object with shard and source properties
    return hits.map(doc => _.merge(doc._source.shard, {
      resolver: _.get(doc, `_source.source_node[${config.get('xpack.monitoring.node_resolver')}]`)
    }));
  });
};
