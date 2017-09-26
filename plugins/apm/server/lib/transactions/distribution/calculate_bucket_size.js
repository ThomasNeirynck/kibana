import {
  APP_NAME,
  TRANSACTION_NAME,
  TRANSACTION_DURATION
} from '../../../../common/constants';

export async function calculateBucketSize({ appName, transactionName, setup }) {
  const { start, end, client, config } = setup;

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
            { term: { [`${TRANSACTION_NAME}.keyword`]: transactionName } },
            { term: { [APP_NAME]: appName } }
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
  const { max } = resp.aggregations.stats;
  const bucketSize = Math.floor(max / bucketTargetCount);

  return bucketSize > minBucketSize ? bucketSize : minBucketSize;
}
