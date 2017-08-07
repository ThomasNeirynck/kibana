import { get, isUndefined } from 'lodash';
import Joi from 'joi';
import { getClusterStats } from '../../../../lib/cluster/get_cluster_stats';
import { getClusterStatus } from '../../../../lib/cluster/get_cluster_status';
import { getNodes } from '../../../../lib/elasticsearch/get_nodes';
import { getShardStats } from '../../../../lib/elasticsearch/get_shard_stats';
import { calculateNodeType } from '../../../../lib/elasticsearch/calculate_node_type';
import { getNodeTypeClassLabel } from '../../../../lib/elasticsearch/get_node_type_class_label';
import { getDefaultNodeFromId } from '../../../../lib/elasticsearch/get_default_node_from_id';
import { handleError } from '../../../../lib/handle_error';
import { prefixIndexPattern } from '../../../../lib/ccs_utils';

export function nodesRoutes(server) {
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch/nodes',
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
          listingMetrics: Joi.array().required()
        })
      }
    },
    async handler(req, reply) {
      const config = server.config();
      const ccs = req.payload.ccs;
      const clusterUuid = req.params.clusterUuid;
      const esIndexPattern = prefixIndexPattern(config, 'xpack.monitoring.elasticsearch.index_pattern', ccs);

      try {
        const clusterStats = await getClusterStats(req, esIndexPattern, clusterUuid);
        const shardStats = await getShardStats(req, esIndexPattern, clusterStats); // needed for summary bar and showing # of shards
        const { nodes, rows } = await getNodes(req, esIndexPattern);

        const clusterState = get(clusterStats, 'cluster_state', { nodes: {} });

        const mappedRows = rows.map(({ name, metrics }) => {
          const node = nodes[name] || getDefaultNodeFromId(name);
          const { nodeType, nodeTypeLabel, nodeTypeClass } = getNodeTypeClassLabel(node);
          const isOnline = !isUndefined(clusterState.nodes[name]);

          const getMetrics = () => {
            return {
              ...metrics,
              shard_count: get(shardStats, `nodes[${name}].shardCount`, 0)
            };
          };
          const _metrics = isOnline ? getMetrics() : undefined;

          return {
            resolver: name,
            online: isOnline,
            metrics: _metrics,
            type: calculateNodeType(node, get(clusterState, 'master_node')),
            node: {
              ...node,
              type: nodeType,
              nodeTypeLabel: nodeTypeLabel,
              nodeTypeClass: nodeTypeClass
            }
          };
        });

        reply({
          clusterStatus: getClusterStatus(clusterStats, get(shardStats, 'indices.totals.unassigned')),
          shardStats,
          nodes,
          rows: mappedRows,
          shardStats
        });
      } catch(err) {
        reply(handleError(err, req));
      }
    }
  });

};
