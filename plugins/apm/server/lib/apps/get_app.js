import {
  APP_NAME,
  TRANSACTION_DURATION,
  TRANSACTION_TYPE
} from '../../../common/constants';

export async function getApp(req) {
  const { start, end, client, intervalString, config } = req.pre.setup;
  const { appName } = req.params;

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 0,
      query: {
        bool: {
          must: [
            { term: { [APP_NAME]: appName } },
            {
              range: {
                '@timestamp': {
                  gte: start,
                  lte: end,
                  format: 'epoch_millis'
                }
              }
            }
          ]
        }
      },
      aggs: {
        avg: {
          avg: { field: TRANSACTION_DURATION }
        },
        types: {
          terms: { field: TRANSACTION_TYPE, size: 100 },
          aggs: {
            avg: {
              avg: { field: TRANSACTION_DURATION }
            },
            timeseries: {
              date_histogram: {
                field: '@timestamp',
                interval: intervalString,
                extended_bounds: {
                  min: start,
                  max: end
                }
              },
              aggs: {
                avg: {
                  avg: { field: TRANSACTION_DURATION }
                }
              }
            }
          }
        }
      }
    }
  };

  const resp = await client('search', params);

  const { types } = resp.aggregations;

  return {
    app_name: appName,
    types: types.buckets.map(bucket => bucket.key),
    chart: types.buckets.reduce((acc, bucket) => {
      acc[bucket.key] = bucket.timeseries.buckets.map(bucket => {
        return [bucket.key_as_string, bucket.avg.value || 0];
      });
      return acc;
    }, {})
  };
}
