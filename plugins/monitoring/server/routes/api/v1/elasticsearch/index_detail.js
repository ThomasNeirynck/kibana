import { get, forEach } from 'lodash';
import Promise from 'bluebird';
import Joi from 'joi';
import { getClusterStats } from '../../../../lib/cluster/get_cluster_stats';
import { getIndexSummary } from '../../../../lib/elasticsearch/get_index_summary';
import { getMetrics } from '../../../../lib/details/get_metrics';
import { getShardAllocation, getShardStats } from '../../../../lib/elasticsearch/shards';
import { handleError } from '../../../../lib/handle_error';
import { prefixIndexPattern } from '../../../../lib/ccs_utils';

export function indexRoutes(server) {

  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch/indices/{id}',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required(),
          id: Joi.string().required()
        }),
        payload: Joi.object({
          ccs: Joi.string().optional(),
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          metrics: Joi.array().required(),
          shards: Joi.boolean().default(true) // false for Advanced view
        })
      }
    },
    handler: (req, reply) => {
      const config = server.config();
      const ccs = req.payload.ccs;
      const clusterUuid = req.params.clusterUuid;
      const indexUuid = req.params.id;
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      const collectShards = req.payload.shards; // for advanced view
      const esIndexPattern = prefixIndexPattern(config, 'xpack.monitoring.elasticsearch.index_pattern', ccs);

      return getClusterStats(req, esIndexPattern, clusterUuid)
      .then(cluster => {
        const showSystemIndices = true; // hardcode to true, because this could be a system index
        let shards;
        if (collectShards) {
          shards = getShardAllocation(req, esIndexPattern, [{ term: { 'shard.index': indexUuid } }], cluster, showSystemIndices);
        }
        return Promise.props({
          indexSummary:  getIndexSummary(req, esIndexPattern, { clusterUuid, indexUuid, start, end }),
          metrics: getMetrics(req, esIndexPattern, [{ term: { 'index_stats.index': indexUuid } }]),
          shards,
          shardStats: getShardStats(req, esIndexPattern, cluster, { includeNodes: true, includeIndices: true })
        });
      })
      .then(body => {
        const shardStats = body.shardStats.indices[indexUuid];
        // check if we need a legacy workaround for Monitoring 2.0 node data
        if (shardStats) {
          body.indexSummary.unassignedShards = shardStats.unassigned.primary + shardStats.unassigned.replica;
          body.indexSummary.totalShards = shardStats.primary + shardStats.replica + body.indexSummary.unassignedShards;
          body.indexSummary.status = shardStats.status;
          body.indexSummary.shardStats = shardStats;
        } else {
          body.indexSummary.status = 'Not Available';
          body.indexSummary.totalShards = 'N/A';
          body.indexSummary.unassignedShards = 'N/A';
          body.indexSummary.documents = 'N/A';
          body.indexSummary.dataSize = {
            primaries: 'N/A',
            total: 'N/A'
          };
        }
        const shardNodes = get(body, 'shardStats.nodes');
        body.nodes = {};
        forEach(shardNodes, (shardNode, resolver) => {
          body.nodes[resolver] = shardNode;
        });

        // shards-indices is only used to see if current index is active, doesn't need to be passed down
        if (collectShards) {
          delete body.shardStats.indicesTotals;
          delete body.shardStats.indices;
        } else {
          delete body.shardStats; // no shard info needed for advanced view
        }

        return body;
      })
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

}
