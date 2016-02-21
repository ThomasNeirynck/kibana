const _ = require('lodash');
const validateMonitoringLicense = require('./validate_monitoring_license');
module.exports = (req) => {
  const server = req.server;
  const callWithRequest = server.plugins.elasticsearch.callWithRequest;
  const config = server.config();
  const params = {
    index: config.get('monitoring.index'),
    type: 'cluster_info',
    meta: 'get_clusters',
    ignore: [404],
    body: {
      size: config.get('monitoring.max_bucket_size')
    }
  };
  return callWithRequest(req, 'search', params)
    .then((resp) => {
      if (resp && resp.hits && _.isArray(resp.hits.hits)) {
        return resp.hits.hits.map((doc) => {
          const cluster = {
            cluster_name: doc._source.cluster_name,
            cluster_uuid: doc._source.cluster_uuid
          };
          const license = doc._source.license;
          if (license && validateMonitoringLicense(cluster.cluster_uuid, license)) {
            cluster.license = license;
            cluster.version = doc._source.version;
          }
          return cluster;
        })
        // Only return clusters with valid licenses
        .filter((cluster) => cluster.license);
      }
    });
};
