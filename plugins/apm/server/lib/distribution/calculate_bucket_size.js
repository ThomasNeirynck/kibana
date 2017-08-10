import { get } from 'lodash';
import {
  APP_NAME,
  TRANSACTION_NAME,
  TRANSACTION_DURATION
} from '../../../common/constants';
export async function calculateBucketSize(req, transactionName) {
  const { start, end, client, config } = req.pre.setup;
  const { appName } = req.params;
  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 0,
      query: {
        bool: {
          must: [
            {
              range: {
                '@timestamp': {
                  gte: start,
                  lte: end,
                  format: 'epoch_millis'
                }
              }
            },
            {
              term: {
                [`${TRANSACTION_NAME}.keyword`]: transactionName
              }
            },
            {
              term: {
                [APP_NAME]: appName
              }
            }
          ]
        }
      },
      aggs: {
        stats: {
          extended_stats: {
            field: TRANSACTION_DURATION
          }
        }
      }
    }
  };

  const resp = await client('search', params);
  const minBucketSize = config.get('xpack.apm.minimumBucketSize');
  const bucketTargetCount = config.get('xpack.apm.bucketTargetCount');
  const max = get(resp, 'aggregations.stats.max');
  const bucketSize = Math.floor(max / bucketTargetCount);

  return bucketSize > minBucketSize ? bucketSize : minBucketSize;
}
