const _ = require('lodash');
const Promise = require('bluebird');
const Joi = require('joi');
const calculateIndices = require('../../../lib/calculate_indices');
const getLastState = require('../../../lib/get_last_state');
const getClusterStatus = require('../../../lib/get_cluster_status');
const getIndexSummary = require('../../../lib/get_index_summary');
const getMetrics = require('../../../lib/get_metrics');
const getListing = require('../../../lib/get_listing_indices');
const getShardStats = require('../../../lib/get_shard_stats');
const getShardAllocation = require('../../../lib/get_shard_allocation');
const getUnassignedShards = require('../../../lib/get_unassigned_shards');
const calculateClusterStatus = require('../../../lib/calculate_cluster_status');
const handleError = require('../../../lib/handle_error');

module.exports = (server) => {

  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/indices',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        }),
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          metrics: Joi.array().required(),
          listingMetrics: Joi.array().required()
        })
      }
    },
    handler: (req, reply) => {
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      calculateIndices(req, start, end)
      .then(indices => {
        return getLastState(req, indices)
        .then(lastState => {
          return Promise.props({
            clusterStatus: getClusterStatus(req, indices, lastState),
            metrics: getMetrics(req, indices),
            rows: getListing(req, indices),
            shardStats: getShardStats(req, indices, lastState)
          });
        });
      })
      // Add the index status to each index from the shardStats
      .then((body) => {
        body.rows.forEach((row) => {
          if (body.shardStats[row.name]) {
            row.status = body.shardStats[row.name].status;
            // column for a metric that is calculated in code vs. calculated in a query
            // it's not given in req.payload.listingMetrics
            _.merge(row, getUnassignedShards(body.shardStats[row.name]));
          } else {
            row.status = 'Unknown';
            _.set(row, 'metrics.index_document_count.inapplicable', true);
            _.set(row, 'metrics.index_size.inapplicable', true);
            _.set(row, 'metrics.index_search_request_rate.inapplicable', true);
            _.set(row, 'metrics.index_request_rate.inapplicable', true);
            _.set(row, 'metrics.index_unassigned_shards.inapplicable', true);
          }
        });
        return body;
      })
      // Send the response
      .then(calculateClusterStatus)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/indices/{id}',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required(),
          id: Joi.string().required()
        }),
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          metrics: Joi.array().required()
        })
      }
    },
    handler: (req, reply) => {
      const id = req.params.id;
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      calculateIndices(req, start, end)
      .then(indices => {
        return getLastState(req, indices)
        .then(lastState => {
          return Promise.props({
            clusterStatus: getClusterStatus(req, indices, lastState),
            indexSummary:  getIndexSummary(req, indices),
            metrics: getMetrics(req, indices, [{ term: { 'index_stats.index': id } }]),
            shards: getShardAllocation(req, indices, [{ term: { 'shard.index': id } }], lastState),
            shardStats: getShardStats(req, indices, lastState),
            lastState: lastState
          });
        });
      })
      .then(calculateClusterStatus)
      .then(function (body) {
        var shardStats = body.shardStats[id];
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
          body.indexSummary.dataSize = 'N/A';
        }
        const shardNodes = _.get(body, 'shardStats.nodes');
        body.nodes = {};
        _.forEach(shardNodes, (shardNode, resolver) => {
          body.nodes[resolver] = shardNode;
        });
        delete body.lastState;
        return body;
      })
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

};
