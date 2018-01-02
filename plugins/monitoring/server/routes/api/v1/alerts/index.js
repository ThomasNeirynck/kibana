import Joi from 'joi';
import { alertsClusterSearch } from '../../../../cluster_alerts/alerts_cluster_search';
import { checkLicense } from '../../../../cluster_alerts/check_license';
import { getClusterLicense } from '../../../../lib/cluster/get_cluster_license';
import { prefixIndexPattern } from '../../../../lib/ccs_utils';

/*
 * Cluster Alerts route.
 */
export function clusterAlertsRoute(server) {
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/alerts',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        }),
        payload: Joi.object({
          ccs: Joi.string().optional()
        })
      }
    },
    handler(req, reply) {
      const config = server.config();
      const ccs = req.payload.ccs;
      const clusterUuid = req.params.clusterUuid;
      const esIndexPattern = prefixIndexPattern(config, 'xpack.monitoring.elasticsearch.index_pattern', ccs);
      const alertsIndex = prefixIndexPattern(config, 'xpack.monitoring.cluster_alerts.index', ccs);

      return getClusterLicense(req, esIndexPattern, clusterUuid)
        .then(license => alertsClusterSearch(req, alertsIndex, { cluster_uuid: clusterUuid, license }, checkLicense))
        .then(reply);
    }
  });
}
