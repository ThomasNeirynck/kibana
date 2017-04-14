export const kibanaVersionMismatch = {
  cluster_uuid_fields: [
    'metadata.name',
    'metadata.xpack.cluster_uuid',
    'input.chain.inputs[0].check.search.request.body.query.bool.filter[0].term.cluster_uuid',
    'input.chain.inputs[1].alert.search.request.body.query.bool.filter.term._id',
    'actions.trigger_alert.index.doc_id'
  ],
  id: 'actions.trigger_alert.index.doc_id',
  watch: {
    metadata: {
      name: 'X-Pack Monitoring: Kibana Version Mismatch ({{cluster_uuid}})',
      xpack: {
        alert_index: '{{alert_index}}',
        cluster_uuid: '{{cluster_uuid}}',
        link: 'kibana/instances',
        severity: 1000,
        type: 'monitoring',
        watch: 'kibana_version_mismatch'
      }
    },
    trigger: {
      schedule: {
        interval: '1m'
      }
    },
    input: {
      chain: {
        inputs: [
          {
            check: {
              search: {
                request: {
                  indices: [
                    '.monitoring-kibana-2-*'
                  ],
                  types: [
                    'kibana_stats'
                  ],
                  body: {
                    size: 0,
                    query: {
                      bool: {
                        filter: [
                          {
                            term: {
                              cluster_uuid: '{{cluster_uuid}}'
                            }
                          },
                          {
                            range: {
                              timestamp: {
                                gte: 'now-2m'
                              }
                            }
                          }
                        ]
                      }
                    },
                    aggs: {
                      group_by_kibana: {
                        terms: {
                          field: 'kibana_stats.kibana.uuid',
                          size: 1000
                        },
                        aggs: {
                          group_by_version: {
                            terms: {
                              field: 'kibana_stats.kibana.version',
                              size: 1,
                              order: {
                                latest_report: 'desc'
                              }
                            },
                            aggs: {
                              latest_report: {
                                max: {
                                  field: 'timestamp'
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            alert: {
              search: {
                request: {
                  indices: [
                    '{{alert_index}}'
                  ],
                  body: {
                    size: 1,
                    terminate_after: 1,
                    query: {
                      bool: {
                        filter: {
                          term: {
                            _id: '{{cluster_uuid}}_kibana_version_mismatch'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    },
    condition: {
      script: {
        inline: (
`ctx.vars.fails_check = false;
if (ctx.payload.check.hits.total != 0 && ctx.payload.check.aggregations.group_by_kibana.buckets.size() > 1) {
  def versions = new HashSet();
  for (def kibana : ctx.payload.check.aggregations.group_by_kibana.buckets) {
    if (kibana.group_by_version.buckets.size() != 0) {
      versions.add(kibana.group_by_version.buckets[0].key);
    }
  }
  if (versions.size() > 1) {
    ctx.vars.fails_check = true;
    ctx.vars.versions = new ArrayList(versions);
    Collections.sort(ctx.vars.versions);
  }
}
ctx.vars.not_resolved = ctx.payload.alert.hits.total == 1 && ctx.payload.alert.hits.hits[0]._source.resolved_timestamp == null;
return ctx.vars.fails_check || ctx.vars.not_resolved;`
        )
      }
    },
    transform: {
      script: {
        inline: (
`def versionMessage = null;
if (ctx.vars.fails_check) {
  versionMessage = 'Versions: [' + String.join(', ', ctx.vars.versions) + '].';
}
if (ctx.vars.not_resolved) {
  ctx.payload = ctx.payload.alert.hits.hits[0]._source;
  if (ctx.vars.fails_check) {
    ctx.payload.message = versionMessage;
  } else {
    ctx.payload.resolved_timestamp = ctx.execution_time;
  }
} else {
  ctx.payload = [
    'timestamp': ctx.execution_time,
    'prefix': 'This cluster is running with multiple versions of Kibana.',
    'message': versionMessage,
    'metadata': ctx.metadata.xpack
  ];
}
ctx.payload.update_timestamp = ctx.execution_time;
return ctx.payload;`
        )
      }
    },
    actions: {
      trigger_alert: {
        index: {
          index: '{{alert_index}}',
          doc_type: 'doc',
          doc_id: '{{cluster_uuid}}_kibana_version_mismatch'
        }
      }
    }
  }
};