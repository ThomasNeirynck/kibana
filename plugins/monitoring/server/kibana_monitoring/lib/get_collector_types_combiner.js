import { get, omit } from 'lodash';
import {
  KIBANA_STATS_TYPE,
  KIBANA_SETTINGS_TYPE,
  KIBANA_USAGE_TYPE
} from '../../../common/constants';
import { sourceKibana } from './source_kibana';

/*
 * Note: The ES Bulk Data Format is an array with 2 objects.
 * The first object is the header, it has a field for the action (index), and
 * metadata of the document (_index, _type, _id).
 * Since the action types are always "index", there second object which is the
 * payload, or the actual document to index.
 */
export function getCollectorTypesCombiner(kbnServer, config, _sourceKibana = sourceKibana) {
  return payload => {
    // default the item to [] to allow destructuring
    const findItem = type => payload.find(item => get(item, '[0].index._type') === type) || [];

    // kibana usage and stats
    let statsResult;
    const [ statsHeader, statsPayload ] = findItem(KIBANA_STATS_TYPE);

    // sourceKibana uses "host" from the kibana stats payload
    const host = get(statsPayload, 'host');
    const kibana = _sourceKibana(kbnServer, config, host);

    if (statsHeader && statsPayload) {
      const [ usageHeader, usagePayload ] = findItem(KIBANA_USAGE_TYPE);
      statsResult = [
        statsHeader,
        {
          ...omit(statsPayload, 'host'), // remove the temp host field
          kibana,
          usage: (usageHeader && usagePayload) ? usagePayload : undefined
        }
      ];
    }

    // kibana settings
    let settingsResult;
    const [ settingsHeader, settingsPayload ] = findItem(KIBANA_SETTINGS_TYPE);
    if (settingsHeader && settingsPayload) {
      settingsResult = [
        settingsHeader,
        {
          ...settingsPayload,
          kibana
        }
      ];
    }

    // return new payload with the combined data
    // adds usage data to stats data
    // strips usage out as a top-level type
    const result = [ statsResult, settingsResult ];

    // remove result items that are undefined
    return result.filter(Boolean);
  };
}
