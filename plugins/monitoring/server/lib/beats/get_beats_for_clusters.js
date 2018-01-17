import { checkParam } from '../error_missing_required';
import { createQuery } from '../create_query.js';
import { BeatsMetric } from '../metrics';
import {
  beatsAggFilterPath,
  beatsUuidsAgg,
  beatsAggResponseHandler,
} from './_beats_stats';

export function handleResponse(clusterUuid, response) {
  const { beatTotal, beatTypes, publishedEvents, bytesSent } = beatsAggResponseHandler(response);

  // combine stats
  const stats = {
    publishedEvents,
    bytesSent,
    beats: {
      total: beatTotal,
      types: beatTypes,
    }
  };

  return {
    clusterUuid,
    stats,
  };
}

export function getBeatsForClusters(req, beatsIndexPattern, clusters) {
  checkParam(beatsIndexPattern, 'beatsIndexPattern in beats/getBeatsForClusters');

  const start = req.payload.timeRange.min;
  const end = req.payload.timeRange.max;
  const config = req.server.config();
  const metric = BeatsMetric.getMetricFields();
  const maxBucketSize = config.get('xpack.monitoring.max_bucket_size');

  return Promise.all(clusters.map(async cluster => {
    const clusterUuid = cluster.cluster_uuid;
    const params = {
      size: 0,
      index: beatsIndexPattern,
      ignoreUnavailable: true,
      filterPath: beatsAggFilterPath,
      body: {
        query: createQuery({
          start,
          end,
          uuid: clusterUuid,
          metric,
        }),
        aggs: beatsUuidsAgg(maxBucketSize)        }
    };

    const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
    const response = await callWithRequest(req, 'search', params);
    return handleResponse(clusterUuid, response, start, end);
  }));
}
