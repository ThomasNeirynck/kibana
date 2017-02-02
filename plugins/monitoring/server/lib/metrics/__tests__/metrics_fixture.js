import _ from 'lodash';

function indexingLatencyCalculation(last) {
  const indexTimeInMillis = _.get(last, 'index_time_in_millis_deriv.value');
  const indexTimeTotal = _.get(last, 'index_total_deriv.value');
  if (indexTimeInMillis && indexTimeTotal) {
    if (indexTimeInMillis < 0 || indexTimeTotal < 0) {
      return null;
    }
    return indexTimeInMillis / indexTimeTotal;
  }
  return 0;
}

function queryLatencyCalculation(last) {
  const queryTimeInMillis = _.get(last, 'query_time_in_millis_deriv.value');
  const queryTimeTotal = _.get(last, 'query_total_deriv.value');
  if (queryTimeInMillis && queryTimeTotal) {
    if (queryTimeInMillis < 0 || queryTimeTotal < 0) {
      return null;
    }
    return queryTimeInMillis / queryTimeTotal;
  }
  return 0;
}

function logstashEventsLatencyCalculation(last) {
  const eventsTimeInMillis = _.get(last, 'events_time_in_millis_deriv.value');
  const eventsTotal = _.get(last, 'events_total_deriv.value');
  if (eventsTimeInMillis && eventsTotal) {
    if (eventsTimeInMillis < 0 || eventsTotal < 0) {
      return null;
    }
    return eventsTimeInMillis / eventsTotal;
  }
  return 0;
}

function quotaMetricCalculation(bucket) {
  const quota = _.get(bucket, 'quota.value');
  const deltaUsage = _.get(bucket, 'usage_deriv.value');
  const deltaPeriods = _.get(bucket, 'periods_deriv.value');

  if (deltaUsage && deltaPeriods && quota > -1) {
    // if throttling is configured
    const factor = deltaUsage / (deltaPeriods * quota * 1000); // convert quota from microseconds to nanoseconds by multiplying 1000
    return factor * 100; // convert factor to percentage

  }
  // if throttling is NOT configured
  return _.get(bucket, 'metric.value'); // "metric" is an auto-added aggregation for `this.field`, which is the "actual" cpu
}


export const expected = {
  'cluster_index_request_rate_primary': {
    'title': 'Indexing Rate',
    'label': 'Primary Shards',
    'field': 'indices_stats._all.primaries.indexing.index_total',
    'description': 'Number of documents being indexed for primary shards.',
    'type': 'index',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '/s',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'cluster_index_request_rate_total': {
    'field': 'indices_stats._all.total.indexing.index_total',
    'title': 'Indexing Rate',
    'label': 'Total Shards',
    'description': 'Number of documents being indexed for primary and replica shards.',
    'type': 'index',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '/s',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'cluster_search_request_rate': {
    'field': 'indices_stats._all.total.search.query_total',
    'title': 'Search Rate',
    'label': 'Total Shards',
    'description':
      'Number of search requests being executed across primary and replica shards. A single search can run against multiple shards!',
    'type': 'cluster',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '/s',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'cluster_index_latency': {
    'calculation': indexingLatencyCalculation,
    'field': 'indices_stats._all.primaries.indexing.index_total',
    'label': 'Indexing Latency',
    'description':
      'Average latency for indexing documents, which is time it takes to index documents divided by number that were indexed. ' +
      'This only considers primary shards.',
    'type': 'cluster',
    'format': '0,0.[00]',
    'metricAgg': 'sum',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'aggs': {
      'index_time_in_millis': {
        'max': {
          'field': 'indices_stats._all.primaries.indexing.index_time_in_millis'
        }
      },
      'index_total': {
        'max': {
          'field': 'indices_stats._all.primaries.indexing.index_total'
        }
      },
      'index_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'index_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'index_total_deriv': {
        'derivative': {
          'buckets_path': 'index_total',
          'gap_policy': 'skip'
        }
      }
    }
  },
  'node_index_latency': {
    'calculation': indexingLatencyCalculation,
    'field': 'node_stats.indices.indexing.index_total',
    'title': 'Latency',
    'label': 'Indexing',
    'description':
      'Average latency for indexing documents, which is time it takes to index documents divided by number that were indexed. ' +
      'This considers any shard located on this node, including replicas.',
    'type': 'node',
    'format': '0,0.[00]',
    'metricAgg': 'sum',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'aggs': {
      'index_time_in_millis': {
        'max': {
          'field': 'node_stats.indices.indexing.index_time_in_millis'
        }
      },
      'index_total': {
        'max': {
          'field': 'node_stats.indices.indexing.index_total'
        }
      },
      'index_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'index_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'index_total_deriv': {
        'derivative': {
          'buckets_path': 'index_total',
          'gap_policy': 'skip'
        }
      }
    }
  },
  'index_latency': {
    'calculation': indexingLatencyCalculation,
    'field': 'index_stats.primaries.indexing.index_total',
    'label': 'Indexing Latency',
    'description':
      'Average latency for indexing documents, which is time it takes to index documents divided by number that were indexed. ' +
      'This only considers primary shards.',
    'type': 'cluster',
    'format': '0,0.[00]',
    'metricAgg': 'sum',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'aggs': {
      'index_time_in_millis': {
        'max': {
          'field': 'index_stats.primaries.indexing.index_time_in_millis'
        }
      },
      'index_total': {
        'max': {
          'field': 'index_stats.primaries.indexing.index_total'
        }
      },
      'index_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'index_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'index_total_deriv': {
        'derivative': {
          'buckets_path': 'index_total',
          'gap_policy': 'skip'
        }
      }
    }
  },
  'cluster_query_latency': {
    'calculation': queryLatencyCalculation,
    'field': 'indices_stats._all.total.search.query_total',
    'label': 'Search Latency',
    'description':
      'Average latency for searching, which is time it takes to execute searches divided by number of searches submitted. ' +
      'This considers primary and replica shards.',
    'type': 'cluster',
    'format': '0,0.[00]',
    'metricAgg': 'sum',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'aggs': {
      'query_time_in_millis': {
        'max': {
          'field': 'indices_stats._all.total.search.query_time_in_millis'
        }
      },
      'query_total': {
        'max': {
          'field': 'indices_stats._all.total.search.query_total'
        }
      },
      'query_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'query_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'query_total_deriv': {
        'derivative': {
          'buckets_path': 'query_total',
          'gap_policy': 'skip'
        }
      }
    }
  },
  'node_query_latency': {
    'calculation': queryLatencyCalculation,
    'field': 'node_stats.indices.search.query_total',
    'title': 'Latency',
    'label': 'Search',
    'description':
      'Average latency for searching, which is time it takes to execute searches divided by number of searches submitted. ' +
      'This considers primary and replica shards.',
    'type': 'node',
    'format': '0,0.[00]',
    'metricAgg': 'sum',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'aggs': {
      'query_time_in_millis': {
        'max': {
          'field': 'node_stats.indices.search.query_time_in_millis'
        }
      },
      'query_total': {
        'max': {
          'field': 'node_stats.indices.search.query_total'
        }
      },
      'query_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'query_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'query_total_deriv': {
        'derivative': {
          'buckets_path': 'query_total',
          'gap_policy': 'skip'
        }
      }
    }
  },
  'query_latency': {
    'calculation': queryLatencyCalculation,
    'field': 'index_stats.total.search.query_total',
    'label': 'Search Latency',
    'description':
      'Average latency for searching, which is time it takes to execute searches divided by number of searches submitted. ' +
      'This considers primary and replica shards.',
    'type': 'cluster',
    'format': '0,0.[00]',
    'metricAgg': 'sum',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false,
    'aggs': {
      'query_time_in_millis': {
        'max': {
          'field': 'index_stats.total.search.query_time_in_millis'
        }
      },
      'query_total': {
        'max': {
          'field': 'index_stats.total.search.query_total'
        }
      },
      'query_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'query_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'query_total_deriv': {
        'derivative': {
          'buckets_path': 'query_total',
          'gap_policy': 'skip'
        }
      }
    }
  },
  'index_indexing_primaries_time': {
    'field': 'index_stats.primaries.indexing.index_time_in_millis',
    'title': 'Request Time',
    'label': 'Indexing (Primaries)',
    'description': 'Amount of time spent performing index operations on primary shards only.',
    'type': 'index',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'index_indexing_total_time': {
    'field': 'index_stats.total.indexing.index_time_in_millis',
    'title': 'Request Time',
    'label': 'Indexing',
    'description': 'Amount of time spent performing index operations on primary and replica shards.',
    'type': 'index',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'index_indexing_total': {
    'field': 'index_stats.primaries.indexing.index_total',
    'title': 'Request Rate',
    'label': 'Index Total',
    'description': 'Amount of indexing operations.',
    'type': 'index',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'index_mem_overall': {
    'field': 'index_stats.total.segments.memory_in_bytes',
    'label': 'Lucene Total',
    'description': 'Total heap memory used by Lucene for current index. This is the sum of other fields for primary and replica shards.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_overall_1': {
    'field': 'index_stats.total.segments.memory_in_bytes',
    'label': 'Lucene Total',
    'description': 'Total heap memory used by Lucene for current index. This is the sum of other fields for primary and replica shards.',
    'type': 'index',
    'title': 'Index Memory - Lucene 1',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_overall_2': {
    'field': 'index_stats.total.segments.memory_in_bytes',
    'label': 'Lucene Total',
    'description': 'Total heap memory used by Lucene for current index. This is the sum of other fields for primary and replica shards.',
    'type': 'index',
    'title': 'Index Memory - Lucene 2',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_overall_3': {
    'field': 'index_stats.total.segments.memory_in_bytes',
    'label': 'Lucene Total',
    'description': 'Total heap memory used by Lucene for current index. This is the sum of other fields for primary and replica shards.',
    'type': 'index',
    'title': 'Index Memory - Lucene 3',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_doc_values': {
    'field': 'index_stats.total.segments.doc_values_memory_in_bytes',
    'label': 'Doc Values',
    'description': 'Heap memory used by Doc Values. This is a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_fielddata': {
    'field': 'index_stats.total.fielddata.memory_size_in_bytes',
    'label': 'Fielddata',
    'description':
      'Heap memory used by Fielddata (e.g., global ordinals or explicitly enabled fielddata on text fields). ' +
      'This is for the same shards, but not a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_fixed_bit_set': {
    'field': 'index_stats.total.segments.fixed_bit_set_memory_in_bytes',
    'label': 'Fixed Bitsets',
    'description': 'Heap memory used by Fixed Bit Sets (e.g., deeply nested documents). This is a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_norms': {
    'field': 'index_stats.total.segments.norms_memory_in_bytes',
    'label': 'Norms',
    'description': 'Heap memory used by Norms (normalization factors for query-time, text scoring). This is a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_points': {
    'field': 'index_stats.total.segments.points_memory_in_bytes',
    'label': 'Points',
    'description': 'Heap memory used by Points (e.g., numbers, IPs, and geo data). This is a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_query_cache': {
    'field': 'index_stats.total.query_cache.memory_size_in_bytes',
    'label': 'Query Cache',
    'description': 'Heap memory used by Query Cache (e.g., cached filters). This is for the same shards, but not a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_query_cache_4': {
    'field': 'index_stats.total.query_cache.memory_size_in_bytes',
    'label': 'Query Cache',
    'description': 'Heap memory used by Query Cache (e.g., cached filters). This is for the same shards, but not a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory - Elasticsearch',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_request_cache': {
    'field': 'index_stats.total.request_cache.memory_size_in_bytes',
    'label': 'Request Cache',
    'description':
      'Heap memory used by Request Cache (e.g., instant aggregations). ' +
      'This is for the same shards, but not a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_stored_fields': {
    'field': 'index_stats.total.segments.stored_fields_memory_in_bytes',
    'label': 'Stored Fields',
    'description': 'Heap memory used by Stored Fields (e.g., _source). This is a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_term_vectors': {
    'field': 'index_stats.total.segments.term_vectors_memory_in_bytes',
    'label': 'Term Vectors',
    'description': 'Heap memory used by Term Vectors. This is a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_terms': {
    'field': 'index_stats.total.segments.terms_memory_in_bytes',
    'label': 'Terms',
    'description': 'Heap memory used by Terms (e.g., text). This is a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_versions': {
    'field': 'index_stats.total.segments.version_map_memory_in_bytes',
    'label': 'Version Map',
    'description': 'Heap memory used by Versioning (e.g., updates and deletes). This is NOT a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_mem_writer': {
    'field': 'index_stats.total.segments.index_writer_memory_in_bytes',
    'label': 'Index Writer',
    'description': 'Heap memory used by the Index Writer. This is NOT a part of Lucene Total.',
    'type': 'index',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_request_rate_primary': {
    'field': 'index_stats.primaries.indexing.index_total',
    'title': 'Indexing Rate',
    'label': 'Primary Shards',
    'description': 'Number of documents being indexed for primary shards.',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '/s',
    'type': 'index',
    'derivative': true,
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'index_segment_merge_primaries_size': {
    'field': 'index_stats.primaries.merges.total_size_in_bytes',
    'title': 'Disk',
    'label': 'Merges (Primaries)',
    'description': 'Size of merges on primary shards.',
    'type': 'index',
    'format': '0,0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'index_segment_merge_total_size': {
    'field': 'index_stats.total.merges.total_size_in_bytes',
    'title': 'Disk',
    'label': 'Merges',
    'description': 'Size of merges on primary and replica shards.',
    'type': 'index',
    'format': '0,0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'index_segment_refresh_primaries_time': {
    'field': 'index_stats.primaries.refresh.total_time_in_millis',
    'title': 'Refresh Time',
    'label': 'Primaries',
    'description': 'Amount of time spent to perform refresh operations on primary shards.',
    'type': 'index',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'index_segment_refresh_total_time': {
    'field': 'index_stats.total.refresh.total_time_in_millis',
    'title': 'Refresh Time',
    'label': 'Total',
    'description': 'Amount of time spent to perform refresh operations on primary and replica shards.',
    'type': 'index',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'index_request_rate_total': {
    'field': 'index_stats.total.indexing.index_total',
    'title': 'Indexing Rate',
    'label': 'Total Shards',
    'description': 'Number of documents being indexed for primary and replica shards.',
    'type': 'index',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '/s',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'index_searching_time': {
    'field': 'index_stats.total.search.query_time_in_millis',
    'title': 'Request Time',
    'label': 'Search',
    'description': 'Amount of time spent performing search operations (per shard).',
    'type': 'index',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'index_searching_total': {
    'field': 'index_stats.total.search.query_total',
    'title': 'Request Rate',
    'label': 'Search Total',
    'description': 'Amount of search operations (per shard).',
    'type': 'index',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'index_segment_count_primaries': {
    'field': 'index_stats.primaries.segments.count',
    'title': 'Segment Count',
    'label': 'Primaries',
    'description': 'Number of segments for primary shards.',
    'type': 'index',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_segment_count_total': {
    'field': 'index_stats.total.segments.count',
    'title': 'Segment Count',
    'label': 'Total',
    'description': 'Number of segments for primary and replica shards.',
    'type': 'index',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_store_primaries_size': {
    'field': 'index_stats.primaries.store.size_in_bytes',
    'title': 'Disk',
    'label': 'Store (Primaries)',
    'description': 'Size of primary shards on disk.',
    'type': 'index',
    'format': '0,0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_store_total_size': {
    'field': 'index_stats.total.store.size_in_bytes',
    'title': 'Disk',
    'label': 'Store',
    'description': 'Size of primary and replica shards on disk.',
    'type': 'index',
    'format': '0,0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_throttling_indexing_primaries_time': {
    'field': 'index_stats.primaries.indexing.throttle_time_in_millis',
    'title': 'Throttle Time',
    'label': 'Indexing (Primaries)',
    'description': 'Amount of time spent throttling index operations on primary shards.',
    'type': 'index',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'index_throttling_indexing_total_time': {
    'field': 'index_stats.total.indexing.throttle_time_in_millis',
    'title': 'Throttle Time',
    'label': 'Indexing',
    'description': 'Amount of time spent throttling index operations on primary and replica shards.',
    'type': 'index',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'search_request_rate': {
    'field': 'index_stats.total.search.query_total',
    'title': 'Search Rate',
    'label': 'Total Shards',
    'description':
      'Number of search requests being executed across primary and replica shards. ' +
      'A single search can run against multiple shards!',
    'type': 'cluster',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '/s',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_cgroup_periods': {
    'field': 'node_stats.os.cgroup.cpu.stat.number_of_elapsed_periods',
    'title': 'Cgroup CFS Stats',
    'label': 'Cgroup Elapsed Periods',
    'description': (
      'The number of sampling periods from the Completely Fair Scheduler (CFS). Compare against the number of times throttled.'
    ),
    'type': 'node',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'node_cgroup_periods': {
    'field': 'node_stats.os.cgroup.cpu.stat.number_of_elapsed_periods',
    'title': 'Cgroup CFS Stats',
    'label': 'Cgroup Elapsed Periods',
    'description': (
      'The number of sampling periods from the Completely Fair Scheduler (CFS). Compare against the number of times throttled.'
    ),
    'type': 'node',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'node_cgroup_throttled': {
    'field': 'node_stats.os.cgroup.cpu.stat.time_throttled_nanos',
    'title': 'Cgroup CPU Performance',
    'label': 'Cgroup Throttling',
    'description': 'The amount of throttled time, reported in nanoseconds, of the Cgroup.',
    'type': 'node',
    'format': '0,0.[0]a',
    'metricAgg': 'max',
    'units': 'ns',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'node_cgroup_throttled_count': {
    'field': 'node_stats.os.cgroup.cpu.stat.number_of_times_throttled',
    'title': 'Cgroup CFS Stats',
    'label': 'Cgroup Throttled Count',
    'description': 'The number of times that the CPU was throttled by the Cgroup.',
    'type': 'node',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'node_cgroup_usage': {
    'field': 'node_stats.os.cgroup.cpuacct.usage_nanos',
    'title': 'Cgroup CPU Performance',
    'label': 'Cgroup Usage',
    'description': 'The usage, reported in nanoseconds, of the Cgroup. Compare this with the throttling to discover issues.',
    'type': 'node',
    'format': '0,0.[0]a',
    'metricAgg': 'max',
    'units': 'ns',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': true
  },
  'node_cgroup_quota': {
    'fieldSource': 'node_stats.os.cgroup',
    'usageField': 'cpuacct.usage_nanos',
    'periodsField': 'cpu.stat.number_of_elapsed_periods',
    'quotaField': 'cpu.cfs_quota_micros',
    'field': 'node_stats.process.cpu.percent',
    'label': 'Cgroup CPU Utilization',
    'title': 'CPU Utilization',
    'description': (
      'CPU Usage time compared to the CPU quota shown in percentage. If CPU ' +
      'quotas are not set, then the OS level CPU usage in percentage is shown.'
    ),
    'type': 'node',
    'app': 'elasticsearch',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'derivative': false,
    'timestampField': 'timestamp',
    'units': '%',
    'uuidField': 'cluster_uuid',
    'calculation': quotaMetricCalculation,
    'aggs': {
      'periods': {
        'max': {
          'field': 'node_stats.os.cgroup.cpu.stat.number_of_elapsed_periods'
        }
      },
      'periods_deriv': {
        'derivative': {
          'buckets_path': 'periods',
          'gap_policy': 'skip'
        }
      },
      'quota': {
        'min': {
          'field': 'node_stats.os.cgroup.cpu.cfs_quota_micros'
        }
      },
      'usage': {
        'max': {
          'field': 'node_stats.os.cgroup.cpuacct.usage_nanos'
        }
      },
      'usage_deriv': {
        'derivative': {
          'buckets_path': 'usage',
          'gap_policy': 'skip'
        }
      }
    }
  },
  'node_cgroup_quota_as_cpu_utilization': {
    'fieldSource': 'node_stats.os.cgroup',
    'usageField': 'cpuacct.usage_nanos',
    'periodsField': 'cpu.stat.number_of_elapsed_periods',
    'quotaField': 'cpu.cfs_quota_micros',
    'field': 'node_stats.process.cpu.percent',
    'label': 'CPU Utilization',
    'description': (
      'CPU Usage time compared to the CPU quota shown in percentage. If CPU ' +
      'quotas are not set, then the OS level CPU usage in percentage is shown.'
    ),
    'type': 'node',
    'app': 'elasticsearch',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'derivative': false,
    'timestampField': 'timestamp',
    'units': '%',
    'uuidField': 'cluster_uuid',
    'calculation': quotaMetricCalculation,
    'aggs': {
      'periods': {
        'max': {
          'field': 'node_stats.os.cgroup.cpu.stat.number_of_elapsed_periods'
        }
      },
      'periods_deriv': {
        'derivative': {
          'buckets_path': 'periods',
          'gap_policy': 'skip'
        }
      },
      'quota': {
        'min': {
          'field': 'node_stats.os.cgroup.cpu.cfs_quota_micros'
        }
      },
      'usage': {
        'max': {
          'field': 'node_stats.os.cgroup.cpuacct.usage_nanos'
        }
      },
      'usage_deriv': {
        'derivative': {
          'buckets_path': 'usage',
          'gap_policy': 'skip'
        }
      }
    }
  },
  'node_cpu_utilization': {
    'field': 'node_stats.process.cpu.percent',
    'label': 'CPU Utilization',
    'description': 'Percentage of CPU usage reported by the OS (100% is the max).',
    'type': 'node',
    'format': '0,0.[00]',
    'metricAgg': 'avg',
    'units': '%',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_segment_count': {
    'field': 'node_stats.indices.segments.count',
    'label': 'Segment Count',
    'description': 'Maximum segment count for primary and replica shards on this node.',
    'type': 'node',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_jvm_gc_old_count': {
    'field': 'node_stats.jvm.gc.collectors.old.collection_count',
    'title': 'GC Count',
    'label': 'Old',
    'description': 'Number of old Garbage Collections.',
    'derivative': true,
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'type': 'node',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_jvm_gc_old_time': {
    'field': 'node_stats.jvm.gc.collectors.old.collection_time_in_millis',
    'title': 'GC Duration',
    'label': 'Old',
    'derivative': true,
    'description': 'Time spent performing old Garbage Collections.',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'type': 'node',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_jvm_gc_young_count': {
    'field': 'node_stats.jvm.gc.collectors.young.collection_count',
    'title': 'GC Count',
    'label': 'Young',
    'description': 'Number of young Garbage Collections.',
    'derivative': true,
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'type': 'node',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_jvm_gc_young_time': {
    'field': 'node_stats.jvm.gc.collectors.young.collection_time_in_millis',
    'title': 'GC Duration',
    'label': 'Young',
    'description': 'Time spent performing young Garbage Collections.',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'type': 'node',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_jvm_mem_max_in_bytes': {
    'field': 'node_stats.jvm.mem.heap_max_in_bytes',
    'title': 'JVM Heap',
    'label': 'Max Heap',
    'description': 'Total heap available to Elasticsearch running in the JVM.',
    'type': 'node',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_jvm_mem_used_in_bytes': {
    'field': 'node_stats.jvm.mem.heap_used_in_bytes',
    'title': 'JVM Heap',
    'label': 'Used Heap',
    'description': 'Total heap used by Elasticsearch running in the JVM.',
    'type': 'node',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_jvm_mem_percent': {
    'field': 'node_stats.jvm.mem.heap_used_percent',
    'title': 'JVM Heap',
    'label': 'Used Heap',
    'description': 'Total heap used by Elasticsearch running in the JVM.',
    'type': 'node',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '%',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_load_average': {
    'field': 'node_stats.os.cpu.load_average.1m',
    'title': 'System Load',
    'label': '1m',
    'description': 'Load average over the last minute.',
    'type': 'node',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_overall': {
    'field': 'node_stats.indices.segments.memory_in_bytes',
    'label': 'Lucene Total',
    'description':
      'Total heap memory used by Lucene for current index. ' +
      'This is the sum of other fields for primary and replica shards on this node.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_overall_1': {
    'field': 'node_stats.indices.segments.memory_in_bytes',
    'label': 'Lucene Total',
    'description':
      'Total heap memory used by Lucene for current index. ' +
      'This is the sum of other fields for primary and replica shards on this node.',
    'type': 'node',
    'title': 'Index Memory - Lucene 1',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_overall_2': {
    'field': 'node_stats.indices.segments.memory_in_bytes',
    'label': 'Lucene Total',
    'description':
      'Total heap memory used by Lucene for current index. ' +
      'This is the sum of other fields for primary and replica shards on this node.',
    'type': 'node',
    'title': 'Index Memory - Lucene 2',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_overall_3': {
    'field': 'node_stats.indices.segments.memory_in_bytes',
    'label': 'Lucene Total',
    'description':
      'Total heap memory used by Lucene for current index. ' +
      'This is the sum of other fields for primary and replica shards on this node.',
    'type': 'node',
    'title': 'Index Memory - Lucene 3',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_doc_values': {
    'field': 'node_stats.indices.segments.doc_values_memory_in_bytes',
    'label': 'Doc Values',
    'description': 'Heap memory used by Doc Values. This is a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_fielddata': {
    'field': 'node_stats.indices.fielddata.memory_size_in_bytes',
    'label': 'Fielddata',
    'description':
      'Heap memory used by Fielddata (e.g., global ordinals or explicitly enabled fielddata on text fields). ' +
      'This is for the same shards, but not a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_fixed_bit_set': {
    'field': 'node_stats.indices.segments.fixed_bit_set_memory_in_bytes',
    'label': 'Fixed Bitsets',
    'description': 'Heap memory used by Fixed Bit Sets (e.g., deeply nested documents). This is a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_norms': {
    'field': 'node_stats.indices.segments.norms_memory_in_bytes',
    'label': 'Norms',
    'description': 'Heap memory used by Norms (normalization factors for query-time, text scoring). This is a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_points': {
    'field': 'node_stats.indices.segments.points_memory_in_bytes',
    'label': 'Points',
    'description': 'Heap memory used by Points (e.g., numbers, IPs, and geo data). This is a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_query_cache': {
    'field': 'node_stats.indices.query_cache.memory_size_in_bytes',
    'label': 'Query Cache',
    'description': 'Heap memory used by Query Cache (e.g., cached filters). This is for the same shards, but not a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_query_cache_4': {
    'field': 'node_stats.indices.query_cache.memory_size_in_bytes',
    'label': 'Query Cache',
    'description': 'Heap memory used by Query Cache (e.g., cached filters). This is for the same shards, but not a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory - Elasticsearch',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_request_cache': {
    'field': 'node_stats.indices.request_cache.memory_size_in_bytes',
    'label': 'Request Cache',
    'description':
      'Heap memory used by Request Cache (e.g., instant aggregations).' +
      ' This is for the same shards, but not a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_stored_fields': {
    'field': 'node_stats.indices.segments.stored_fields_memory_in_bytes',
    'label': 'Stored Fields',
    'description': 'Heap memory used by Stored Fields (e.g., _source). This is a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_term_vectors': {
    'field': 'node_stats.indices.segments.term_vectors_memory_in_bytes',
    'label': 'Term Vectors',
    'description': 'Heap memory used by Term Vectors. This is a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_terms': {
    'field': 'node_stats.indices.segments.terms_memory_in_bytes',
    'label': 'Terms',
    'description': 'Heap memory used by Terms (e.g., text). This is a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_versions': {
    'field': 'node_stats.indices.segments.version_map_memory_in_bytes',
    'label': 'Version Map',
    'description': 'Heap memory used by Versioning (e.g., updates and deletes). This is NOT a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_mem_writer': {
    'field': 'node_stats.indices.segments.index_writer_memory_in_bytes',
    'label': 'Index Writer',
    'description': 'Heap memory used by the Index Writer. This is NOT a part of Lucene Total.',
    'type': 'node',
    'title': 'Index Memory',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_index_threads_bulk_queue': {
    'field': 'node_stats.thread_pool.bulk.queue',
    'title': 'Indexing Threads',
    'label': 'Bulk Queue',
    'description': 'Number of bulk operations in the queue.',
    'type': 'node',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'min': 0,
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_index_threads_bulk_rejected': {
    'field': 'node_stats.thread_pool.bulk.rejected',
    'title': 'Indexing Threads',
    'label': 'Bulk Rejections',
    'description': 'Number of bulk operations that have been rejected, which occurs when the queue is full.',
    'type': 'node',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'min': 0,
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_index_threads_get_queue': {
    'field': 'node_stats.thread_pool.get.queue',
    'title': 'Read Threads',
    'label': 'GET Queue',
    'description': 'Number of GET operations in the queue.',
    'type': 'node',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'min': 0,
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_index_threads_get_rejected': {
    'field': 'node_stats.thread_pool.get.rejected',
    'title': 'Read Threads',
    'label': 'GET Rejections',
    'description': 'Number of GET operations that have been rejected, which occurs when the queue is full.',
    'type': 'node',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'min': 0,
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_index_threads_index_queue': {
    'field': 'node_stats.thread_pool.index.queue',
    'title': 'Indexing Threads',
    'label': 'Index Queue',
    'description': 'Number of non-bulk, index operations in the queue.',
    'type': 'node',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'min': 0,
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_index_threads_index_rejected': {
    'field': 'node_stats.thread_pool.index.rejected',
    'title': 'Indexing Threads',
    'label': 'Index Rejections',
    'description':
      'Number of non-bulk, index operations that have been rejected, which occurs when the queue is full. ' +
      'Generally indicates that bulk should be used.',
    'type': 'node',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'min': 0,
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_index_threads_search_queue': {
    'field': 'node_stats.thread_pool.search.queue',
    'title': 'Read Threads',
    'label': 'Search Queue',
    'description': 'Number of search operations in the queue (e.g., shard level searches).',
    'type': 'node',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'min': 0,
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_index_threads_search_rejected': {
    'field': 'node_stats.thread_pool.search.rejected',
    'title': 'Read Threads',
    'label': 'Search Rejections',
    'description': 'Number of search operations that have been rejected, which occurs when the queue is full.',
    'type': 'node',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'min': 0,
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_index_total': {
    'field': 'node_stats.indices.indexing.index_total',
    'title': 'Request Rate',
    'label': 'Indexing Total',
    'description': 'Amount of indexing operations.',
    'type': 'node',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_index_time': {
    'field': 'node_stats.indices.indexing.index_time_in_millis',
    'title': 'Indexing Time',
    'label': 'Index Time',
    'description': 'Amount of time spent on indexing operations.',
    'type': 'node',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_free_space': {
    'field': 'node_stats.fs.total.available_in_bytes',
    'label': 'Disk Free Space',
    'description': 'Free disk space available on the node.',
    'type': 'node',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_search_total': {
    'field': 'node_stats.indices.search.query_total',
    'title': 'Request Rate',
    'label': 'Search Total',
    'description': 'Amount of search operations (per shard).',
    'type': 'node',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_threads_queued_bulk': {
    'field': 'node_stats.thread_pool.bulk.queue',
    'label': 'Bulk',
    'description':
      'Number of bulk indexing operations waiting to be processed on this node.' +
      ' A single bulk request can create multiple bulk operations.',
    'title': 'Thread Queue',
    'type': 'node',
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_threads_queued_generic': {
    'field': 'node_stats.thread_pool.generic.queue',
    'label': 'Generic',
    'description': 'Number of generic (internal) operations waiting to be processed on this node.',
    'title': 'Thread Queue',
    'type': 'node',
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_threads_queued_get': {
    'field': 'node_stats.thread_pool.get.queue',
    'title': 'Thread Queue',
    'label': 'Get',
    'description': 'Number of get operations waiting to be processed on this node.',
    'type': 'node',
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_threads_queued_index': {
    'field': 'node_stats.thread_pool.index.queue',
    'label': 'Index',
    'description': 'Number of non-bulk, index operations waiting to be processed on this node.',
    'title': 'Thread Queue',
    'type': 'node',
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_threads_queued_management': {
    'field': 'node_stats.thread_pool.management.queue',
    'label': 'Management',
    'description': 'Number of management (internal) operations waiting to be processed on this node.',
    'title': 'Thread Queue',
    'type': 'node',
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_threads_queued_search': {
    'field': 'node_stats.thread_pool.search.queue',
    'label': 'Search',
    'description':
      'Number of search operations waiting to be processed on this node. ' +
      'A single search request can create multiple search operations.',
    'title': 'Thread Queue',
    'type': 'node',
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_threads_queued_watcher': {
    'field': 'node_stats.thread_pool.watcher.queue',
    'label': 'Watcher',
    'description': 'Number of Watcher operations waiting to be processed on this node.',
    'title': 'Thread Queue',
    'type': 'node',
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'node_threads_rejected_bulk': {
    'field': 'node_stats.thread_pool.bulk.rejected',
    'label': 'Bulk',
    'description': 'Bulk rejections. These occur when the queue is full.',
    'title': 'Thread Rejections',
    'type': 'node',
    'derivative': true,
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_threads_rejected_generic': {
    'field': 'node_stats.thread_pool.generic.rejected',
    'label': 'Generic',
    'description': 'Generic (internal) rejections. These occur when the queue is full.',
    'title': 'Thread Rejections',
    'type': 'node',
    'derivative': true,
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_threads_rejected_get': {
    'field': 'node_stats.thread_pool.get.rejected',
    'label': 'Get',
    'description': 'Get rejections. These occur when the queue is full.',
    'title': 'Thread Rejections',
    'type': 'node',
    'derivative': true,
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_threads_rejected_index': {
    'field': 'node_stats.thread_pool.index.rejected',
    'label': 'Index',
    'description': 'Index rejections. These occur when the queue is full. You should look at bulk indexing.',
    'title': 'Thread Rejections',
    'type': 'node',
    'derivative': true,
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_threads_rejected_management': {
    'field': 'node_stats.thread_pool.management.rejected',
    'label': 'Management',
    'description': 'Get (internal) rejections. These occur when the queue is full.',
    'title': 'Thread Rejections',
    'type': 'node',
    'derivative': true,
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_threads_rejected_search': {
    'field': 'node_stats.thread_pool.search.rejected',
    'label': 'Search',
    'description': 'Search rejections. These occur when the queue is full. This can indicate over-sharding.',
    'title': 'Thread Rejections',
    'type': 'node',
    'derivative': true,
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_threads_rejected_watcher': {
    'field': 'node_stats.thread_pool.watcher.rejected',
    'label': 'Watcher',
    'description': 'Watch rejections. These occur when the queue is full. This can indicate stuck-Watches.',
    'title': 'Thread Rejections',
    'type': 'node',
    'derivative': true,
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'node_throttle_index_time': {
    'field': 'node_stats.indices.indexing.throttle_time_in_millis',
    'title': 'Indexing Time',
    'label': 'Index Throttling Time',
    'description': 'Amount of time spent with index throttling, which indicates slow disks on a node.',
    'type': 'node',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'min': 0,
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'index_throttle_time': {
    'field': 'index_stats.primaries.indexing.throttle_time_in_millis',
    'label': 'Index Throttling Time',
    'description': 'Amount of time spent with index throttling, which indicates slow merging.',
    'type': 'index',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'index_document_count': {
    'field': 'index_stats.primaries.docs.count',
    'label': 'Document Count',
    'description': 'Total number of documents, only including primary shards.',
    'type': 'index',
    'format': '0,0.[0]a',
    'metricAgg': 'max',
    'units': '',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_search_request_rate': {
    'field': 'index_stats.total.search.query_total',
    'title': 'Search Rate',
    'label': 'Total Shards',
    'description':
      'Number of search requests being executed across primary and replica shards. ' +
      'A single search can run against multiple shards!',
    'type': 'index',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '/s',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'index_merge_rate': {
    'field': 'index_stats.total.merges.total_size_in_bytes',
    'label': 'Merge Rate',
    'description': 'Amount in bytes of merged segments. Larger numbers indicate heavier disk activity.',
    'type': 'index',
    'derivative': true,
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '/s',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'index_size': {
    'field': 'index_stats.total.store.size_in_bytes',
    'label': 'Index Size',
    'description': 'Size of the index on disk for primary and replica shards.',
    'type': 'index',
    'format': '0,0.0 b',
    'metricAgg': 'avg',
    'units': 'B',
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp',
    'derivative': false
  },
  'index_refresh_time': {
    'field': 'total.refresh.total_time_in_millis',
    'label': 'Total Refresh Time',
    'description': 'Time spent on Elasticsearch refresh for primary and replica shards.',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'type': 'index',
    'derivative': true,
    'app': 'elasticsearch',
    'uuidField': 'cluster_uuid',
    'timestampField': 'timestamp'
  },
  'kibana_os_load_1m': {
    'title': 'System Load',
    'field': 'kibana_stats.os.load.1m',
    'label': '1m',
    'description': 'Load average over the last minute.',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false
  },
  'kibana_os_load_5m': {
    'title': 'System Load',
    'field': 'kibana_stats.os.load.5m',
    'label': '5m',
    'description': 'Load average over the last 5 minutes.',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false
  },
  'kibana_os_load_15m': {
    'title': 'System Load',
    'field': 'kibana_stats.os.load.15m',
    'label': '15m',
    'description': 'Load average over the last 15 minutes.',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false
  },
  'kibana_memory_heap_size_limit': {
    'title': 'Memory Size',
    'field': 'kibana_stats.process.memory.heap.size_limit',
    'label': 'Heap Size Limit',
    'description': 'Limit of memory usage before garbage collection.',
    'format': '0,0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false
  },
  'kibana_memory_size': {
    'title': 'Memory Size',
    'field': 'kibana_stats.process.memory.resident_set_size_in_bytes',
    'label': 'Memory Size',
    'description': 'Total heap used by Kibana running in Node.js.',
    'format': '0,0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false
  },
  'kibana_process_delay': {
    'field': 'kibana_stats.process.event_loop_delay',
    'label': 'Event Loop Delay',
    'description':
      'Delay in Kibana server event loops. Longer delays may indicate blocking events in server thread, such as ' +
      'synchronous functions taking large amount of CPU time.',
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false
  },
  'kibana_average_response_times': {
    'title': 'Client Response Time',
    'field': 'kibana_stats.response_times.average',
    'label': 'Average',
    'description': 'Average response time for client requests to the Kibana instance.',
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false
  },
  'kibana_max_response_times': {
    'title': 'Client Response Time',
    'field': 'kibana_stats.response_times.max',
    'label': 'Max',
    'description': 'Maximum response time for client requests to the Kibana instance.',
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': 'ms',
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false
  },
  'kibana_average_concurrent_connections': {
    'field': 'kibana_stats.concurrent_connections',
    'label': 'HTTP Connections',
    'description': 'Total number of open socket connections to the Kibana instance.',
    'format': '0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false
  },
  'kibana_requests': {
    'field': 'kibana_stats.requests.total',
    'label': 'Client Requests',
    'description': 'Total number of client requests received by the Kibana instance.',
    'format': '0.[00]',
    'metricAgg': 'sum',
    'units': '',
    'app': 'kibana',
    'uuidField': 'kibana_stats.kibana.uuid',
    'timestampField': 'kibana_stats.timestamp',
    'derivative': false
  },
  'logstash_events_input_rate': {
    'field': 'logstash_stats.events.in',
    'label': 'Events Received Rate',
    'description': 'Total number of events received by the Logstash node at the inputs stage.',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '/s',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': true
  },
  'logstash_events_output_rate': {
    'field': 'logstash_stats.events.out',
    'label': 'Events Emitted Rate',
    'description': 'Total number of events emitted by the Logstash node at the outputs stage.',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '/s',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': true
  },
  'logstash_events_latency': {
    'calculation': logstashEventsLatencyCalculation,
    'field': 'logstash_stats.events.out',
    'label': 'Event Latency',
    'description': (
      'Average time spent by events in the filter and output stages, which is the total ' +
      'time it takes to process events divided by number of events emitted.'
    ),
    'format': '0,0.[00]',
    'metricAgg': 'sum',
    'units': 'ms',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': false,
    'aggs': {
      'events_time_in_millis': {
        'max': {
          'field': 'logstash_stats.events.duration_in_millis'
        }
      },
      'events_total': {
        'max': {
          'field': 'logstash_stats.events.out'
        }
      },
      'events_time_in_millis_deriv': {
        'derivative': {
          'buckets_path': 'events_time_in_millis',
          'gap_policy': 'skip'
        }
      },
      'events_total_deriv': {
        'derivative': {
          'buckets_path': 'events_total',
          'gap_policy': 'skip'
        }
      }
    }
  },
  'logstash_os_load_1m': {
    'title': 'System Load',
    'field': 'logstash_stats.os.cpu.load_average.1m',
    'label': '1m',
    'description': 'Load average over the last minute.',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': false
  },
  'logstash_os_load_5m': {
    'title': 'System Load',
    'field': 'logstash_stats.os.cpu.load_average.5m',
    'label': '5m',
    'description': 'Load average over the last 5 minutes.',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': false
  },
  'logstash_os_load_15m': {
    'title': 'System Load',
    'field': 'logstash_stats.os.cpu.load_average.15m',
    'label': '15m',
    'description': 'Load average over the last 15 minutes.',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': false
  },
  'logstash_node_jvm_mem_max_in_bytes': {
    'title': 'JVM Heap',
    'field': 'logstash_stats.jvm.mem.heap_max_in_bytes',
    'label': 'Max Heap',
    'description': 'Total heap available to Logstash running in the JVM.',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': false
  },
  'logstash_node_jvm_mem_used_in_bytes': {
    'title': 'JVM Heap',
    'field': 'logstash_stats.jvm.mem.heap_used_in_bytes',
    'label': 'Used Heap',
    'description': 'Total heap used by Logstash running in the JVM.',
    'format': '0.0 b',
    'metricAgg': 'max',
    'units': 'B',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': false
  },
  'logstash_node_cpu_utilization': {
    'field': 'logstash_stats.process.cpu.percent',
    'label': 'CPU Utilization',
    'description': 'Percentage of CPU usage reported by the OS (100% is the max).',
    'format': '0,0.[00]',
    'metricAgg': 'avg',
    'units': '%',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': false
  },
  'logstash_node_cgroup_periods': {
    'field': 'logstash_stats.os.cgroup.cpu.stat.number_of_elapsed_periods',
    'title': 'Cgroup CFS Stats',
    'label': 'Cgroup Elapsed Periods',
    'description': (
      'The number of sampling periods from the Completely Fair Scheduler (CFS). Compare against the number of times throttled.'
    ),
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': true
  },
  'logstash_node_cgroup_periods': {
    'field': 'logstash_stats.os.cgroup.cpu.stat.number_of_elapsed_periods',
    'title': 'Cgroup CFS Stats',
    'label': 'Cgroup Elapsed Periods',
    'description': (
      'The number of sampling periods from the Completely Fair Scheduler (CFS). Compare against the number of times throttled.'
    ),
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': true
  },
  'logstash_node_cgroup_throttled': {
    'field': 'logstash_stats.os.cgroup.cpu.stat.time_throttled_nanos',
    'title': 'Cgroup CPU Performance',
    'label': 'Cgroup Throttling',
    'description': 'The amount of throttled time, reported in nanoseconds, of the Cgroup.',
    'format': '0,0.[0]a',
    'metricAgg': 'max',
    'units': 'ns',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': true
  },
  'logstash_node_cgroup_throttled_count': {
    'field': 'logstash_stats.os.cgroup.cpu.stat.number_of_times_throttled',
    'title': 'Cgroup CFS Stats',
    'label': 'Cgroup Throttled Count',
    'description': 'The number of times that the CPU was throttled by the Cgroup.',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'units': '',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': true
  },
  'logstash_node_cgroup_usage': {
    'field': 'logstash_stats.os.cgroup.cpuacct.usage_nanos',
    'title': 'Cgroup CPU Performance',
    'label': 'Cgroup Usage',
    'description': 'The usage, reported in nanoseconds, of the Cgroup. Compare this with the throttling to discover issues.',
    'format': '0,0.[0]a',
    'metricAgg': 'max',
    'units': 'ns',
    'app': 'logstash',
    'uuidField': 'logstash_stats.logstash.uuid',
    'timestampField': 'logstash_stats.timestamp',
    'derivative': true
  },
  'logstash_node_cgroup_quota': {
    'fieldSource': 'logstash_stats.os.cgroup',
    'usageField': 'cpuacct.usage_nanos',
    'periodsField': 'cpu.stat.number_of_elapsed_periods',
    'quotaField': 'cpu.cfs_quota_micros',
    'field': 'logstash_stats.process.cpu.percent',
    'label': 'Cgroup CPU Utilization',
    'title': 'CPU Utilization',
    'description': (
      'CPU Usage time compared to the CPU quota shown in percentage. If CPU ' +
      'quotas are not set, then the OS level CPU usage in percentage is shown.'
    ),
    'app': 'logstash',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'derivative': false,
    'timestampField': 'logstash_stats.timestamp',
    'units': '%',
    'uuidField': 'logstash_stats.logstash.uuid',
    'calculation': quotaMetricCalculation,
    'aggs': {
      'periods': {
        'max': {
          'field': 'logstash_stats.os.cgroup.cpu.stat.number_of_elapsed_periods'
        }
      },
      'periods_deriv': {
        'derivative': {
          'buckets_path': 'periods',
          'gap_policy': 'skip'
        }
      },
      'quota': {
        'min': {
          'field': 'logstash_stats.os.cgroup.cpu.cfs_quota_micros'
        }
      },
      'usage': {
        'max': {
          'field': 'logstash_stats.os.cgroup.cpuacct.usage_nanos'
        }
      },
      'usage_deriv': {
        'derivative': {
          'buckets_path': 'usage',
          'gap_policy': 'skip'
        }
      }
    }
  },
  'logstash_node_cgroup_quota_as_cpu_utilization': {
    'fieldSource': 'logstash_stats.os.cgroup',
    'usageField': 'cpuacct.usage_nanos',
    'periodsField': 'cpu.stat.number_of_elapsed_periods',
    'quotaField': 'cpu.cfs_quota_micros',
    'field': 'logstash_stats.process.cpu.percent',
    'label': 'CPU Utilization',
    'description': (
      'CPU Usage time compared to the CPU quota shown in percentage. If CPU ' +
      'quotas are not set, then the OS level CPU usage in percentage is shown.'
    ),
    'app': 'logstash',
    'format': '0,0.[00]',
    'metricAgg': 'max',
    'derivative': false,
    'timestampField': 'logstash_stats.timestamp',
    'units': '%',
    'uuidField': 'logstash_stats.logstash.uuid',
    'calculation': quotaMetricCalculation,
    'aggs': {
      'periods': {
        'max': {
          'field': 'logstash_stats.os.cgroup.cpu.stat.number_of_elapsed_periods'
        }
      },
      'periods_deriv': {
        'derivative': {
          'buckets_path': 'periods',
          'gap_policy': 'skip'
        }
      },
      'quota': {
        'min': {
          'field': 'logstash_stats.os.cgroup.cpu.cfs_quota_micros'
        }
      },
      'usage': {
        'max': {
          'field': 'logstash_stats.os.cgroup.cpuacct.usage_nanos'
        }
      },
      'usage_deriv': {
        'derivative': {
          'buckets_path': 'usage',
          'gap_policy': 'skip'
        }
      }
    }
  }
};

