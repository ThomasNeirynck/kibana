import { createQuery } from '../create_query';
import { ElasticsearchMetric } from '../metrics';
import { get } from 'lodash';

export async function getPipelineStateDocument(callWithRequest, req, logstashIndexPattern,
  { clusterUuid, pipelineId, version }) {
  const filters = [
    { term: { 'logstash_state.pipeline.id': pipelineId } },
    { term: { 'logstash_state.pipeline.hash': version.hash } }
  ];

  const query = createQuery({
    // We intentionally do not set a start/end time for the state document
    // The reason being that any matching document will work since they are all identical if they share a given hash
    // This is important because a user may pick a very narrow time picker window. If we were to use a start/end value
    // that could result in us being unable to render the graph
    // Use the logstash_stats documents to determine whether the instance is up/down
    type: 'logstash_state',
    metric: ElasticsearchMetric.getMetricFields(),
    clusterUuid,
    filters
  });

  const params = {
    index: logstashIndexPattern,
    size: 1,
    body: {
      sort: { timestamp: { order: 'desc' } },
      query,
      terminate_after: 1 // Safe to do because all these documents are functionally identical
    },
  };

  const resp = await callWithRequest(req, 'search', params);

  // Return null if doc not found
  return get(resp, 'hits.hits[0]._source', null);
}
