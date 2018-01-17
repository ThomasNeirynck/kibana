import moment from 'moment';
import { capitalize, get } from 'lodash';
import { checkParam } from '../error_missing_required';
import { BeatsMetric } from '../metrics';
import { createQuery } from '../create_query';
import { calculateRate } from '../calculate_rate';

export function handleResponse(response, start, end) {
  const hits = get(response, 'hits.hits', []);
  return hits.map(hit => {
    const stats = get(hit, '_source.beats_stats');
    const earliestStats = get(hit, 'inner_hits.earliest.hits.hits[0]._source.beats_stats');

    const rateOptions = {
      hitTimestamp: get(stats, 'timestamp'),
      earliestHitTimestamp: get(earliestStats, 'timestamp'),
      timeWindowMin: start,
      timeWindowMax: end,
    };

    const { rate: bytesSentRate } = calculateRate({
      latestTotal: get(stats, 'metrics.libbeat.output.write.bytes'),
      earliestTotal: get(earliestStats, 'metrics.libbeat.output.write.bytes'),
      ...rateOptions
    });

    const { rate: publishedEventsRate } = calculateRate({
      latestTotal: get(stats, 'metrics.libbeat.pipeline.events.published'),
      earliestTotal: get(earliestStats, 'metrics.libbeat.pipeline.events.published'),
      ...rateOptions
    });

    return {
      uuid: get(stats, 'beat.uuid'),
      name: get(stats, 'beat.name'),
      version: get(stats, 'beat.version'),
      bytes_sent_rate: bytesSentRate,
      published_events_rate: publishedEventsRate,
      memory: get(stats, 'metrics.beat.memstats.memory_alloc'),
      type: capitalize(get(stats, 'beat.type')),
      output: capitalize(get(stats, 'metrics.libbeat.output.type')),
    };
  });
}

export function getBeats(req, beatsIndexPattern, clusterUuid) {
  checkParam(beatsIndexPattern, 'beatsIndexPattern in getBeats');

  const config = req.server.config();
  const start = moment.utc(req.payload.timeRange.min).valueOf();
  const end = moment.utc(req.payload.timeRange.max).valueOf();

  const params = {
    index: beatsIndexPattern,
    size: config.get('xpack.monitoring.max_bucket_size'), // FIXME
    ignoreUnavailable: true,
    filterPath: [ // only filter path can filter for inner_hits
      'hits.hits._source.beats_stats.beat.uuid',
      'hits.hits._source.beats_stats.beat.name',
      'hits.hits._source.beats_stats.beat.host',
      'hits.hits._source.beats_stats.beat.type',
      'hits.hits._source.beats_stats.beat.version',
      'hits.hits._source.beats_stats.metrics.libbeat.output.type',
      'hits.hits._source.beats_stats.metrics.beat.memstats.memory_alloc',

      // latest hits for calculating metrics
      'hits.hits._source.beats_stats.timestamp',
      'hits.hits._source.beats_stats.metrics.libbeat.output.write.bytes',
      'hits.hits._source.beats_stats.metrics.libbeat.pipeline.events.published',

      // earliest hits for calculating metrics
      'hits.hits.inner_hits.earliest.hits.hits._source.beats_stats.timestamp',
      'hits.hits.inner_hits.earliest.hits.hits._source.beats_stats.metrics.libbeat.output.write.bytes',
      'hits.hits.inner_hits.earliest.hits.hits._source.beats_stats.metrics.libbeat.pipeline.events.published',
    ],
    body: {
      query: createQuery({
        start,
        end,
        uuid: clusterUuid,
        metric: BeatsMetric.getMetricFields(),
        type: 'beats_stats',
      }),
      collapse: {
        field: 'beats_stats.beat.uuid',
        inner_hits: {
          name: 'earliest',
          size: 1,
          sort: [ { 'beats_stats.timestamp': 'asc' } ]
        }
      },
      sort: [ { timestamp: { order: 'desc' } } ]
    }
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'search', params)
    .then(response => handleResponse(response, start, end));
}
