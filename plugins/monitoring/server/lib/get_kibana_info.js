import _ from 'lodash';
import calculateAvailability from './calculate_availability';
export default function getKibanaInfo(req, uuid) {
  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const config = req.server.config();
  const params = {
    index: config.get('xpack.monitoring.index'),
    type: 'kibana',
    meta: 'get_kibana_info',
    id: uuid
  };

  return callWithRequest(req, 'get', params)
  .then(resp => {
    const getSource = key => _.get(resp, `_source.kibana.${key}`);
    const timestamp = getSource('timestamp');
    const kibana = getSource('kibana');
    const availability = { availability: calculateAvailability(timestamp) };
    const freeMemory = { os_memory_free: getSource('os.memory.free_in_bytes') };
    return _.merge(kibana, availability, freeMemory);
  });
}
