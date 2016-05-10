const Promise = require('bluebird');
const _ = require('lodash');
const Joi = require('joi');
const calculateIndices = require('../../../lib/calculate_indices');
const getClusters = require('../../../lib/get_clusters');
const getClustersStats = require('../../../lib/get_clusters_stats');
const getClustersHealth = require('../../../lib/get_clusters_health');
const getKibanasForClusters = require('../../../lib/get_kibanas_for_clusters');
const getLastState = require('../../../lib/get_last_state');
const getClusterStatus = require('../../../lib/get_cluster_status');
const getMetrics = require('../../../lib/get_metrics');
const getShardStats = require('../../../lib/get_shard_stats');
const getLastRecovery = require('../../../lib/get_last_recovery');
const calculateClusterStatus = require('../../../lib/calculate_cluster_status');
const handleError = require('../../../lib/handle_error');

module.exports = (server) => {
  const config = server.config();
  const callWithRequest = server.plugins.monitoring.callWithRequest;

  /*
   * Monitoring Home, Route Init
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters',
    config: {
      validate: {
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required()
        })
      }
    },
    handler: (req, reply) => {
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      const kbnIndexPattern = req.server.config().get('xpack.monitoring.kibana_prefix') + '*';
      Promise.all([
        calculateIndices(req, start, end),
        calculateIndices(req, start, end, kbnIndexPattern)
      ])
      .then(([esIndices, kibanaIndices]) => {
        return getClusters(req, esIndices)
        .then(getClustersStats(req))
        .then(getClustersHealth(req))
        .then(getKibanasForClusters(req, kibanaIndices))
        .then(clusters => reply(_.sortBy(clusters, 'cluster_name')));
      })
      .catch(err => reply(handleError(err, req)));
    }
  });

  /*
   * Elasticsearch Overview
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}',
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
          metrics: Joi.array().required()
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
            shardStats: getShardStats(req, indices, lastState),
            shardActivity: getLastRecovery(req, indices)
          });
        });
      })
      .then(calculateClusterStatus)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

  /*
   * Phone Home
   */
  server.route({
    method: 'GET',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/info',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        })
      }
    },
    handler: (req, reply) => {
      const params = {
        index: config.get('xpack.monitoring.index'),
        meta: 'route-cluster_info',
        type: 'cluster_info',
        id: req.params.clusterUuid
      };
      return callWithRequest(req, 'get', params)
      .then(resp => {
        const fields = [
          'cluster_uuid',
          'timestamp',
          'cluster_name',
          'version',
          'license',
          'cluster_stats'
        ];
        const info = _.pick(resp._source, fields);
        const usage = _.set({}, 'stack_stats.xpack', _.get(req, 'server.plugins.xpackMain.usage'));
        reply(_.merge(info, usage));
      })
      .catch(err => reply(handleError(err, req)));
    }
  });
};
