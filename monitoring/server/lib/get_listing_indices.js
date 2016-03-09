/* Run an aggregation on index_stats to get stat data for the selected time
 * range for all the active indices. The stat data is built up with passed-in
 * options that are given by the UI client as an array
 * (req.payload.listingMetrics). Every option is a key to a configuration value
 * in server/lib/metrics. Those options are used to build up a query with a
 * bunch of date histograms.
 *
 * After the result comes back from Elasticsearch, we process the date
 * histogram data with mapListingResponse to transform it into X/Y coordinates
 * for charting. This method is shared by the get_listing_nodes lib.
 */

const moment = require('moment');
const createQuery = require('./create_query.js');
const calcAuto = require('./calculate_auto');
const root = require('requirefrom')('');
const metrics = root('server/lib/metrics');
const mapListingResponse = require('./map_listing_response');

module.exports = (req, indices) => {
  const config = req.server.config();
  const callWithRequest = req.server.plugins.elasticsearch.callWithRequest;
  const listingMetrics = req.payload.listingMetrics || [];
  let start = moment.utc(req.payload.timeRange.min).valueOf();
  const orgStart = start;
  const end = moment.utc(req.payload.timeRange.max).valueOf();
  const clusterUuid = req.params.clusterUuid;
  const maxBucketSize = config.get('monitoring.max_bucket_size');
  const minIntervalSeconds = config.get('monitoring.min_interval_seconds');

  const params = {
    index: indices,
    meta: 'get_listing_indices',
    type: 'index_stats',
    size: 0,
    ignoreUnavailable: true,
    ignore: [404],
    body: {
      query: createQuery({ start, end, clusterUuid }),
      aggs: {}
    }
  };

  const max = end;
  const duration = moment.duration(max - orgStart, 'ms');
  const bucketSize = Math.max(minIntervalSeconds, calcAuto.near(100, duration).asSeconds());
  // performance optimization, just a few buckets are needed for table row listing
  // start-end must be large enough to cover bucket size
  start = moment.utc(end).subtract((bucketSize * 20), 'seconds').valueOf();
  const min = start;

  var aggs = {
    items: {
      terms: { field: 'index_stats.index', size: maxBucketSize },
      aggs: {}
    }
  };

  listingMetrics.forEach((id) => {
    const metric = metrics[id];
    let metricAgg = null;
    if (!metric) return;
    if (!metric.aggs) {
      metricAgg = {
        metric: {},
        metric_deriv: {
          derivative: { buckets_path: 'metric', unit: 'second' }
        }
      };
      metricAgg.metric[metric.metricAgg] = {
        field: metric.field
      };
    }

    aggs.items.aggs[id] = {
      date_histogram: {
        field: 'timestamp',
        min_doc_count: 0,
        interval: bucketSize + 's',
        extended_bounds: {
          min: min,
          max: max
        }
      },
      aggs: metric.aggs || metricAgg
    };
  });

  params.body.aggs = aggs;

  return callWithRequest(req, 'search', params)
  .then((resp) => {
    if (!resp.hits.total) return [];

    const buckets = resp.aggregations.items.buckets;
    return mapListingResponse({ buckets, listingMetrics, min, max, bucketSize });
  });

};
