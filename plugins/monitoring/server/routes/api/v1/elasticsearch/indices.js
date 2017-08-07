import { merge, set } from 'lodash';
import Promise from 'bluebird';
import Joi from 'joi';
import { getClusterStats } from '../../../../lib/cluster/get_cluster_stats';
import { getClusterStatus } from '../../../../lib/cluster/get_cluster_status';
import { calculateClusterShards } from '../../../../lib/cluster/calculate_cluster_shards';
import { getIndices } from '../../../../lib/elasticsearch/get_indices';
import { getShardStats } from '../../../../lib/elasticsearch/get_shard_stats';
import { getUnassignedShards } from '../../../../lib/elasticsearch/get_unassigned_shards';
import { handleError } from '../../../../lib/handle_error';
import { prefixIndexPattern } from '../../../../lib/ccs_utils';

export function indicesRoutes(server) {
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch/indices',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        }),
        payload: Joi.object({
          ccs: Joi.string().optional(),
          showSystemIndices: Joi.boolean().default(false), // show/hide indices in listing
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          listingMetrics: Joi.array().required()
        })
      }
    },
    handler: (req, reply) => {
      const config = server.config();
      const ccs = req.payload.ccs;
      const clusterUuid = req.params.clusterUuid;
      const showSystemIndices = req.payload.showSystemIndices;
      const esIndexPattern = prefixIndexPattern(config, 'xpack.monitoring.elasticsearch.index_pattern', ccs);

      return getClusterStats(req, esIndexPattern, clusterUuid)
      .then(cluster => {
        return Promise.props({
          clusterStatus: getClusterStatus(cluster),
          rows: getIndices(req, esIndexPattern, showSystemIndices),
          shardStats: getShardStats(req, esIndexPattern, cluster)
        });
      })
      // Add the index status to each index from the shardStats
      .then((body) => {
        body.rows.forEach((row) => {
          if (body.shardStats.indices[row.name]) {
            row.status = body.shardStats.indices[row.name].status;
            // column for a metric that is calculated in code vs. calculated in a query
            // it's not given in req.payload.listingMetrics
            merge(row, getUnassignedShards(body.shardStats.indices[row.name]));
          } else {
            row.status = 'Unknown';
            set(row, 'metrics.index_document_count.inapplicable', true);
            set(row, 'metrics.index_size.inapplicable', true);
            set(row, 'metrics.index_search_request_rate.inapplicable', true);
            set(row, 'metrics.index_request_rate.inapplicable', true);
            set(row, 'metrics.index_unassigned_shards.inapplicable', true);
          }
        });
        return body;
      })
      // Send the response
      .then(calculateClusterShards)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
};
