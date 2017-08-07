import Promise from 'bluebird';
import Joi from 'joi';
import { getClusterStats } from '../../../../lib/cluster/get_cluster_stats';
import { getClusterStatus } from '../../../../lib/cluster/get_cluster_status';
import { calculateClusterShards } from '../../../../lib/cluster/calculate_cluster_shards';
import { getLastRecovery } from '../../../../lib/elasticsearch/get_last_recovery';
import { getShardStats } from '../../../../lib/elasticsearch/get_shard_stats';
import { getMetrics } from '../../../../lib/details/get_metrics';
import { handleError } from '../../../../lib/handle_error';
import { prefixIndexPattern } from '../../../../lib/ccs_utils';

// manipulate cluster status and license meta data
export function clustersRoutes(server) {
  /**
   * Elasticsearch Overview
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        }),
        payload: Joi.object({
          ccs: Joi.string().optional(),
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          metrics: Joi.array().required()
        })
      }
    },
    handler: (req, reply) => {
      const config = server.config();
      const ccs = req.payload.ccs;
      const clusterUuid = req.params.clusterUuid;
      const esIndexPattern = prefixIndexPattern(config, 'xpack.monitoring.elasticsearch.index_pattern', ccs);

      return getClusterStats(req, esIndexPattern, clusterUuid)
      .then(cluster => {
        return Promise.props({
          clusterStatus: getClusterStatus(cluster),
          metrics: getMetrics(req, esIndexPattern),
          shardStats: getShardStats(req, esIndexPattern, cluster),
          shardActivity: getLastRecovery(req, esIndexPattern)
        });
      })
      .then(calculateClusterShards)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
};
