import { handleResponse } from '../get_beats';
import expect from 'expect.js';

describe('beats/get_beats', () => {
  it('Handles empty response', () => {
    expect(handleResponse()).to.eql([]);
  });

  it('Maps hits into a listing', () => {
    const start = 1515534342000;
    const end = 1515541592880;
    const response = {
      hits: {
        hits: [
          {
            _source: {
              beats_stats: {
                timestamp: end,
                beat: {
                  uuid: 'fooUuid',
                  host: 'beat-listing.test',
                  name: 'beat-listing.test-0101',
                  type: 'filebeat',
                  version: '6.2.0'
                },
                metrics: {
                  beat: {
                    memstats: {
                      memory_alloc: 2340
                    }
                  },
                  libbeat: {
                    output: {
                      type: 'Redis',
                      write: {
                        bytes: 140000
                      }
                    },
                    pipeline: {
                      events: {
                        published: 23000
                      }
                    }
                  }
                }
              }
            },
            inner_hits: {
              earliest: {
                hits: {
                  hits: [
                    {
                      _source: {
                        beats_stats: {
                          timestamp: start,
                          metrics: {
                            libbeat: {
                              output: {
                                write: {
                                  bytes: 4000
                                }
                              },
                              pipeline: {
                                events: {
                                  published: 2300
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        ]
      }
    };

    expect(handleResponse(response, start, end)).to.eql([
      {
        bytes_sent_rate: 18.756344057548876,
        memory: 2340,
        name: 'beat-listing.test-0101',
        output: 'Redis',
        published_events_rate: 2.8548258969945715,
        type: 'Filebeat',
        uuid: 'fooUuid',
        version: '6.2.0'
      }
    ]);
  });
});
