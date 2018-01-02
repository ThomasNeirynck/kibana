import expect from 'expect.js';
import {
  _vertexStats,
  _enrichStateWithStatsAggregation
} from '../get_pipeline';

describe('get_pipeline', () => {
  describe('_vertexStats function', () => {
    let vertex;
    let vertexStatsBucket;
    let totalProcessorsDurationInMillis;
    let timeboundsInMillis;

    beforeEach(() => {
      vertex = {
        plugin_type: 'input'
      };

      vertexStatsBucket = {
        events_in_total: { value: 10000 },
        events_out_total: { value: 9000 },
        duration_in_millis_total: { value: 18000 },
        queue_push_duration_in_millis_total: { value: 100000 },
        queue_push_duration_in_millis: { value: 20000 }
      };

      totalProcessorsDurationInMillis = 24000;
      timeboundsInMillis = 15 * 60 * 1000;
    });

    it('returns correct stats', () => {
      const result = _vertexStats(vertex, vertexStatsBucket, totalProcessorsDurationInMillis, timeboundsInMillis);
      expect(result).to.eql({
        events_in: 10000,
        events_out: 9000,
        duration_in_millis: 18000,
        events_per_millisecond: 0.01,
        millis_per_event: 2,
        queue_push_duration_in_millis: 100000,
        queue_push_duration_in_millis_per_event: 11.11111111111111
      });
    });

    describe('vertex represents filter plugin', () => {
      beforeEach(() => {
        vertex = {
          plugin_type: 'filter'
        };
      });

      it('returns correct stats', () => {
        const result = _vertexStats(vertex, vertexStatsBucket, totalProcessorsDurationInMillis, timeboundsInMillis);
        expect(result).to.eql({
          events_in: 10000,
          events_out: 9000,
          duration_in_millis: 18000,
          events_per_millisecond: 0.01,
          millis_per_event: 2,
          percent_of_total_processor_duration: 0.75
        });
      });
    });

    describe('vertex represents output plugin', () => {
      beforeEach(() => {
        vertex = {
          plugin_type: 'output'
        };
      });

      it('returns correct stats', () => {
        const result = _vertexStats(vertex, vertexStatsBucket, totalProcessorsDurationInMillis, timeboundsInMillis);
        expect(result).to.eql({
          events_in: 10000,
          events_out: 9000,
          duration_in_millis: 18000,
          events_per_millisecond: 0.01,
          millis_per_event: 2,
          percent_of_total_processor_duration: 0.75
        });
      });
    });

    describe('events_out_total is absent', () => {
      beforeEach(() => {
        delete vertexStatsBucket.events_out_total;
      });

      it ('eventsTotal falls back to events_in_total', () => {
        const result = _vertexStats(vertex, vertexStatsBucket, totalProcessorsDurationInMillis, timeboundsInMillis);
        expect(result).to.eql({
          events_out: null,
          events_in: 10000,
          duration_in_millis: 18000,
          events_per_millisecond: 0.011111111111111112,
          millis_per_event: 1.8,
          queue_push_duration_in_millis: 100000,
          queue_push_duration_in_millis_per_event: 10
        });
      });
    });
  });

  describe('_enrichStateWithStatsAggregation function', () => {
    let stateDocument;
    let statsAggregation;
    let timeboundsInMillis;

    beforeEach(() => {
      stateDocument = {
        cluster_uuid: 'g31hizD1QFimSLDx_ibbeQ',
        timestamp: '2017-07-24T23:24:58.320Z',
        type: 'logstash_state',
        source_node: {
          uuid: 'B0buMd-LQMiFBxVSqqh77g',
          host: '127.0.0.1',
          transport_address: '127.0.0.1:9300',
          ip: '127.0.0.1',
          name: 'B0buMd-',
          attributes: {
            'ml.enabled': 'true'
          }
        },
        logstash_state: {
          pipeline: {
            batch_size: 125,
            id: 'main',
            ephemeral_id: '2c53e689-62e8-4ef3-bc57-ea968531a848',
            workers: 1,
            representation: {
              type: 'lir',
              version: '0.0.0',
              hash: 'eada8baceee81726f6be9d0a071beefad3d9a2fd1b5f5d916011dca9fa66d081',
              plugins: [],
              graph: {
                vertices: [
                  {
                    config_name: 'stdin',
                    plugin_type: 'input',
                    id: 'mystdin',
                    type: 'plugin'
                  },
                  {
                    config_name: 'stdout',
                    plugin_type: 'output',
                    id: 'mystdout',
                    type: 'plugin'
                  }
                ],
                edges: [
                  {
                    from: 'mystdin',
                    to: '__QUEUE__',
                    id: 'c56369ba2e160c8add43e8f105ca17c374b27f4b4627ea4566f066b0ead0bcc7',
                    type: 'plain'
                  },
                  {
                    from: '__QUEUE__',
                    to: 'mystdout',
                    id: '8a5222282b023399a14195011f2a14aa54a4d97810cd9e0a63c5cd98856bb70f',
                    type: 'plain'
                  }
                ]
              }
            },
            hash: 'eada8baceee81726f6be9d0a071beefad3d9a2fd1b5f5d916011dca9fa66d081'
          }
        }
      };

      statsAggregation = {
        aggregations: {
          pipelines: {
            doc_count: 14,
            scoped: {
              doc_count: 14,
              events_duration: {
                count: 14,
                min: 3549,
                max: 15372,
                avg: 9820,
                sum: 137480
              },
              timebounds: {
                doc_count: 633,
                first_seen: {
                  value: 1511275538320,
                  value_as_string: '2017-11-21T14:45:38.320Z'
                },
                last_seen: {
                  value: 1511286565801,
                  value_as_string: '2017-11-21T17:49:25.801Z'
                }
              },
              vertices: {
                doc_count: 98,
                vertex_id: {
                  doc_count_error_upper_bound: 0,
                  sum_other_doc_count: 0,
                  buckets: [
                    {
                      key: 'mystdin',
                      events_in_total: { value: 29 },
                      events_out_total: { value: 28 },
                      duration_in_millis_total: { value: 7000 },
                      queue_push_duration_in_millis_total: { value: 600 }
                    },                    {
                      key: 'mystdout',
                      doc_count: 14,
                      events_in_total: { value: 28 },
                      events_out_total: { value: 27 },
                      duration_in_millis_total: { value: 6500 },
                      queue_push_duration_in_millis_total: { value: null }
                    },
                  ]
                }
              }
            }
          },
          nodes_count: { value: 1 },
          in_total: { value: 2900 },
          out_total: { value: 2801 }
        }
      };

      timeboundsInMillis = 11027481; // last_seen - first_seen in aggs response
    });

    it('enriches the state document correctly with stats', () => {
      const enrichedStateDocument = _enrichStateWithStatsAggregation(stateDocument, statsAggregation, timeboundsInMillis);
      expect(enrichedStateDocument).to.eql({
        pipeline: {
          batch_size: 125,
          ephemeral_id: '2c53e689-62e8-4ef3-bc57-ea968531a848',
          hash: 'eada8baceee81726f6be9d0a071beefad3d9a2fd1b5f5d916011dca9fa66d081',
          id: 'main',
          representation: {
            type: 'lir',
            version: '0.0.0',
            hash: 'eada8baceee81726f6be9d0a071beefad3d9a2fd1b5f5d916011dca9fa66d081',
            graph: {
              vertices: [
                {
                  config_name: 'stdin',
                  id: 'mystdin',
                  type: 'plugin',
                  plugin_type: 'input',
                  stats: {
                    duration_in_millis: 7000,
                    events_in: 29,
                    events_out: 28,
                    events_per_millisecond: 0.0000025391111533087203,
                    millis_per_event: 250,
                    queue_push_duration_in_millis: 600,
                    queue_push_duration_in_millis_per_event: 21.428571428571427
                  }
                },
                {
                  config_name: 'stdout',
                  id: 'mystdout',
                  type: 'plugin',
                  plugin_type: 'output',
                  stats: {
                    duration_in_millis: 6500,
                    events_in: 28,
                    events_out: 27,
                    events_per_millisecond: 0.000002448428612119123,
                    millis_per_event: 240.74074074074073,
                    percent_of_total_processor_duration: 0.5497758606106741
                  }
                }
              ],
              edges: [
                {
                  id: 'c56369ba2e160c8add43e8f105ca17c374b27f4b4627ea4566f066b0ead0bcc7',
                  from: 'mystdin',
                  to: '__QUEUE__',
                  type: 'plain'
                },
                {
                  id: '8a5222282b023399a14195011f2a14aa54a4d97810cd9e0a63c5cd98856bb70f',
                  from: '__QUEUE__',
                  to: 'mystdout',
                  type: 'plain'
                }
              ]
            },
            plugins: []
          },
          workers: 1
        }
      });
    });
  });
});
