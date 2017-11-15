import {
  TRANSACTION_DURATION,
  TRANSACTION_RESULT,
  APP_NAME,
  TRANSACTION_TYPE,
  TRANSACTION_NAME
} from '../../../../common/constants';
import { isNumber, get, sortBy } from 'lodash';
import { getBucketSize } from '../../helpers/get_bucket_size';

export async function getTimeseriesData({
  appName,
  transactionType,
  transactionName,
  setup
}) {
  const { start, end, client, config } = setup;
  const { intervalString } = getBucketSize(start, end, '1m');

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 0,
      query: {
        bool: {
          must: [
            { term: { [APP_NAME]: appName } },
            { term: { [TRANSACTION_TYPE]: transactionType } },
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
        response_times: {
          date_histogram: {
            field: '@timestamp',
            interval: intervalString,
            min_doc_count: 0,
            extended_bounds: {
              min: start,
              max: end
            }
          },
          aggs: {
            avg: {
              avg: { field: TRANSACTION_DURATION }
            },
            pct: {
              percentiles: {
                field: TRANSACTION_DURATION,
                percents: [95, 99]
              }
            }
          }
        },
        overall_avg: {
          avg: { field: TRANSACTION_DURATION }
        },
        transaction_results: {
          terms: {
            field: TRANSACTION_RESULT
          },
          aggs: {
            overall_avg: {
              stats_bucket: {
                buckets_path: 'timeseries>rpm[normalized_value]'
              }
            },
            timeseries: {
              date_histogram: {
                field: '@timestamp',
                interval: intervalString,
                min_doc_count: 0,
                extended_bounds: {
                  min: start.valueOf(),
                  max: end.valueOf()
                }
              },
              aggs: {
                cumsum: {
                  cumulative_sum: {
                    buckets_path: '_count'
                  }
                },
                rpm: {
                  derivative: {
                    buckets_path: 'cumsum',
                    unit: '1m'
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  if (transactionName) {
    params.body.query.bool.must.push({
      term: { [`${TRANSACTION_NAME}.keyword`]: transactionName }
    });
  }

  const resp = await client('search', params);
  const responseTimeBuckets = get(resp, 'aggregations.response_times.buckets');
  const transactionResultBuckets = get(
    resp,
    'aggregations.transaction_results.buckets'
  );
  const overallAvg = get(resp, 'aggregations.overall_avg.value');

  const tpmBuckets = sortBy(
    transactionResultBuckets.map(({ key, timeseries, overall_avg }) => ({
      key,
      avg: overall_avg.avg,
      values: timeseries.buckets.map(
        bucket => get(bucket.rpm, 'normalized_value') || 0
      )
    })),
    bucket => bucket.key.replace(/^HTTP (\d)xx$/, '00$1') // ensure that HTTP 3xx are sorted at the top
  );

  return {
    total_hits: resp.hits.total,
    dates: get(transactionResultBuckets, '[0].timeseries.buckets').map(
      bucket => bucket.key
    ),
    response_times: responseTimeBuckets.reduce(
      (acc, bucket) => {
        const p95 = bucket.pct.values['95.0'];
        const p99 = bucket.pct.values['99.0'];

        acc.avg.push(bucket.avg.value || 0);
        acc.p95.push((isNumber(p95) && p95) || 0);
        acc.p99.push((isNumber(p99) && p99) || 0);
        return acc;
      },
      { avg: [], p95: [], p99: [] }
    ),
    tpm_buckets: tpmBuckets,

    weighted_average: overallAvg || 0
  };
}
