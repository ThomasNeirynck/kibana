import { getUsageStats, combineStats, rollUpTotals } from '../get_kibana_stats';
import expect from 'expect.js';

describe('Get Kibana Stats', () => {
  describe('Make a map of usage stats for each cluster', () => {
    it('passes through if there are no kibana instances', () => {
      const rawStats = {};
      expect(getUsageStats(rawStats)).to.eql({});
    });

    describe('with single cluster', () => {
      describe('single index', () => {
        it('for a single unused instance', () => {
          const rawStats = {
            hits: {
              hits: [{
                _source: {
                  cluster_uuid: 'clusterone',
                  kibana_stats: {
                    kibana: { version: '7.0.0-alpha1-test01' },
                    usage: {
                      dashboard: { total: 0 },
                      visualization: { total: 0 },
                      search: { total: 0 },
                      index_pattern: { total: 0 },
                      graph_workspace: { total: 1 },
                      timelion_sheet: { total: 1 },
                      index: '.kibana-test-01'
                    }
                  }
                }
              }]
            }
          };
          const expected = {
            clusterone: {
              dashboard: { total: 0 },
              visualization: { total: 0 },
              search: { total: 0 },
              index_pattern: { total: 0 },
              graph_workspace: { total: 1 },
              timelion_sheet: { total: 1 },
              indices: 1
            }
          };

          expect(getUsageStats(rawStats)).to.eql(expected);
        });

        it('for a single instance of active usage', () => {
          const rawStats = {
            hits: {
              hits: [{
                _source: {
                  cluster_uuid: 'clusterone',
                  kibana_stats: {
                    kibana: { version: '7.0.0-alpha1-test02' },
                    usage: {
                      dashboard: { total: 1 },
                      visualization: { total: 3 },
                      search: { total: 1 },
                      index_pattern: { total: 1 },
                      graph_workspace: { total: 1 },
                      timelion_sheet: { total: 1 },
                      index: '.kibana-test-01'
                    }
                  }
                }
              }]
            }
          };
          const expected = {
            clusterone: {
              dashboard: { total: 1 },
              visualization: { total: 3 },
              search: { total: 1 },
              index_pattern: { total: 1 },
              graph_workspace: { total: 1 },
              timelion_sheet: { total: 1 },
              indices: 1
            }
          };

          expect(getUsageStats(rawStats)).to.eql(expected);
        });
      });

      describe('separate indices', () => {
        it('with one unused instance', () => {
          const rawStats = {
            hits: {
              hits: [{
                _source: {
                  cluster_uuid: 'clusterone',
                  kibana_stats: {
                    kibana: { version: '7.0.0-alpha1-test03' },
                    usage: {
                      dashboard: { total: 1 },
                      visualization: { total: 3 },
                      search: { total: 1 },
                      index_pattern: { total: 1 },
                      graph_workspace: { total: 1 },
                      timelion_sheet: { total: 1 },
                      index: '.kibana-test-01'
                    }
                  }
                }
              }, {
                _source: {
                  cluster_uuid: 'clusterone',
                  kibana_stats: {
                    kibana: { version: '7.0.0-alpha1-test04' },
                    usage: {
                      dashboard: { total: 1 },
                      visualization: { total: 3 },
                      search: { total: 1 },
                      index_pattern: { total: 1 },
                      graph_workspace: { total: 1 },
                      timelion_sheet: { total: 1 },
                      index: '.kibana-test-01'
                    }
                  }
                }
              }, {
                _source: {
                  cluster_uuid: 'clusterone',
                  kibana_stats: {
                    kibana: { version: '7.0.0-alpha1-test05' },
                    usage: {
                      dashboard: { total: 0 },
                      visualization: { total: 0 },
                      search: { total: 0 },
                      index_pattern: { total: 0 },
                      graph_workspace: { total: 1 },
                      timelion_sheet: { total: 1 },
                      index: '.kibana-test-02'
                    }
                  }
                }
              }]
            }
          };
          const expected = {
            clusterone: {
              dashboard: { total: 1 },
              visualization: { total: 3 },
              search: { total: 1 },
              index_pattern: { total: 1 },
              graph_workspace: { total: 2 },
              timelion_sheet: { total: 2 },
              indices: 2
            }
          };

          expect(getUsageStats(rawStats)).to.eql(expected);
        });

        it('with all actively used instances', () => {
          const rawStats = {
            hits: {
              hits: [{
                _source: {
                  cluster_uuid: 'clusterone',
                  kibana_stats: {
                    kibana: { version: '7.0.0-alpha1-test05' },
                    usage: {
                      dashboard: { total: 1 },
                      visualization: { total: 3 },
                      search: { total: 1 },
                      index_pattern: { total: 1 },
                      graph_workspace: { total: 1 },
                      timelion_sheet: { total: 1 },
                      index: '.kibana-test-01'
                    }
                  }
                }
              }, {
                _source: {
                  cluster_uuid: 'clusterone',
                  kibana_stats: {
                    kibana: { version: '7.0.0-alpha1-test06' },
                    usage: {
                      dashboard: { total: 1 },
                      visualization: { total: 3 },
                      search: { total: 1 },
                      index_pattern: { total: 1 },
                      graph_workspace: { total: 1 },
                      timelion_sheet: { total: 1 },
                      index: '.kibana-test-01'
                    }
                  }
                }
              }, {
                _source: {
                  cluster_uuid: 'clusterone',
                  kibana_stats: {
                    kibana: { version: '7.0.0-alpha1-test07' },
                    usage: {
                      dashboard: { total: 3 },
                      visualization: { total: 5 },
                      search: { total: 3 },
                      index_pattern: { total: 3 },
                      graph_workspace: { total: 1 },
                      timelion_sheet: { total: 1 },
                      index: '.kibana-test-02'
                    }
                  }
                }
              }]
            }
          };
          const expected = {
            clusterone: {
              dashboard: { total: 4 },
              visualization: { total: 8 },
              search: { total: 4 },
              index_pattern: { total: 4 },
              graph_workspace: { total: 2 },
              timelion_sheet: { total: 2 },
              indices: 2
            }
          };

          expect(getUsageStats(rawStats)).to.eql(expected);
        });
      });
    });

    describe('with multiple clusters', () => {
      describe('separate indices', () => {
        it('with all actively used instances', () => {
          const rawStats = {
            hits: {
              hits: [{
                _source: {
                  cluster_uuid: 'clusterone',
                  kibana_stats: {
                    kibana: { version: '7.0.0-alpha1-test08' },
                    usage: {
                      dashboard: { total: 1 },
                      visualization: { total: 3 },
                      search: { total: 1 },
                      index_pattern: { total: 1 },
                      graph_workspace: { total: 3 },
                      timelion_sheet: { total: 4 },
                      index: '.kibana-test-01'
                    }
                  }
                }
              }, {
                _source: {
                  cluster_uuid: 'clusterone',
                  kibana_stats: {
                    kibana: { version: '7.0.0-alpha1-test09' },
                    usage: {
                      dashboard: { total: 1 },
                      visualization: { total: 3 },
                      search: { total: 1 },
                      index_pattern: { total: 1 },
                      graph_workspace: { total: 3 },
                      timelion_sheet: { total: 4 },
                      index: '.kibana-test-01'
                    }
                  }
                }
              }, {
                _source: {
                  cluster_uuid: 'clusterone',
                  kibana_stats: {
                    kibana: { version: '7.0.0-alpha1-test10' },
                    usage: {
                      dashboard: { total: 3 },
                      visualization: { total: 5 },
                      search: { total: 3 },
                      index_pattern: { total: 3 },
                      graph_workspace: { total: 3 },
                      timelion_sheet: { total: 4 },
                      index: '.kibana-test-02'
                    }
                  }
                }
              }, {
                _source: {
                  cluster_uuid: 'clustertwo',
                  kibana_stats: {
                    kibana: { version: '7.0.0-alpha1-test11' },
                    usage: {
                      dashboard: { total: 300 },
                      visualization: { total: 500 },
                      search: { total: 300 },
                      index_pattern: { total: 300 },
                      graph_workspace: { total: 3 },
                      timelion_sheet: { total: 4 },
                      index: '.kibana-test-03'
                    }
                  }
                }
              }]
            }
          };
          const expected = {
            clusterone: {
              dashboard: { total: 4 },
              visualization: { total: 8 },
              search: { total: 4 },
              index_pattern: { total: 4 },
              graph_workspace: { total: 6 },
              timelion_sheet: { total: 8 },
              indices: 2
            },
            clustertwo: {
              dashboard: { total: 300 },
              visualization: { total: 500 },
              search: { total: 300 },
              index_pattern: { total: 300 },
              graph_workspace: { total: 3 },
              timelion_sheet: { total: 4 },
              indices: 1
            }
          };

          expect(getUsageStats(rawStats)).to.eql(expected);
        });
      });
    });
  });

  describe('Combines usage stats with high-level stats', () => {
    it('passes through if there are no kibana instances', () => {
      const highLevelStats = {};
      const usageStats = {};

      expect(combineStats(highLevelStats, usageStats)).to.eql({});
    });

    describe('adds usage stats to high-level stats', () => {
      it('for a single cluster', () => {
        const highLevelStats = {
          clusterone: {
            count: 2,
            versions: [ { count: 2, version: '7.0.0-alpha1-test12' } ]
          }
        };
        const usageStats = {
          clusterone: {
            dashboard: { total: 1 },
            index_pattern: { total: 3 },
            indices: 2,
            search: { total: 1 },
            visualization: { total: 7 }
          }
        };

        expect(combineStats(highLevelStats, usageStats)).to.eql({
          clusterone: {
            count: 2,
            dashboard: { total: 1 },
            index_pattern: { total: 3 },
            indices: 2,
            search: { total: 1 },
            versions: [ { count: 2, version: '7.0.0-alpha1-test12' } ],
            visualization: { total: 7 }
          }
        });
      });

      it('for multiple single clusters', () => {
        const highLevelStats = {
          clusterone: {
            count: 2,
            versions: [ { count: 2, version: '7.0.0-alpha1-test13' } ]
          },
          clustertwo: {
            count: 1,
            versions: [ { count: 1, version: '7.0.0-alpha1-test14' } ]
          }
        };
        const usageStats = {
          clusterone: {
            dashboard: { total: 1 },
            index_pattern: { total: 3 },
            indices: 2,
            search: { total: 1 },
            visualization: { total: 7 }
          },
          clustertwo: {
            dashboard: { total: 3 },
            index_pattern: { total: 5 },
            indices: 1,
            search: { total: 3 },
            visualization: { total: 15 }
          }
        };

        expect(combineStats(highLevelStats, usageStats)).to.eql({
          clusterone: {
            count: 2,
            dashboard: { total: 1 },
            index_pattern: { total: 3 },
            indices: 2,
            search: { total: 1 },
            versions: [ { count: 2, version: '7.0.0-alpha1-test13' } ],
            visualization: { total: 7 }
          },
          clustertwo: {
            count: 1,
            dashboard: { total: 3 },
            index_pattern: { total: 5 },
            indices: 1,
            search: { total: 3 },
            versions: [ { count: 1, version: '7.0.0-alpha1-test14' } ],
            visualization: { total: 15 }
          }
        });
      });
    });

    describe('if usage stats are empty', () => {
      it('returns just high-level stats', () => {
        const highLevelStats = {
          clusterone: {
            count: 2,
            versions: [ { count: 2, version: '7.0.0-alpha1-test12' } ]
          }
        };
        const usageStats = undefined;

        expect(combineStats(highLevelStats, usageStats)).to.eql({
          clusterone: {
            count: 2,
            versions: [ { count: 2, version: '7.0.0-alpha1-test12' } ]
          }
        });
      });
    });
  });

  describe('Rolls up stats when there are multiple Kibana indices for a cluster', () => {
    it('by combining the `total` fields where previous was 0', () => {
      const rollUp = { my_field: { total: 0 } };
      const addOn = { my_field: { total: 1 } };

      expect(rollUpTotals(rollUp, addOn, 'my_field')).to.eql({ total: 1 });
    });

    it('by combining the `total` fields with > 1 for previous and addOn', () => {
      const rollUp = { my_field: { total: 1 } };
      const addOn = { my_field: { total: 3 } };

      expect(rollUpTotals(rollUp, addOn, 'my_field')).to.eql({ total: 4 });

    });
  });
});
