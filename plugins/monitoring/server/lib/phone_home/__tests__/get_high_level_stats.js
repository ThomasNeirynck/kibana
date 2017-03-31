import expect from 'expect.js';
import sinon from 'sinon';
import { fetchHighLevelStats, getHighLevelStats, handleHighLevelStatsResponse } from '../get_high_level_stats';

describe('get_high_level_stats', () => {
  const callWithRequest = sinon.stub();
  const size = 123;
  const product = 'xyz';
  const start = 0;
  const end = 1;
  const indices = `.monitoring-${product}-N-2017`;
  const req = {
    server: {
      config: sinon.stub().returns({
        get: sinon.stub().withArgs(`xpack.monitoring.${product}.index_pattern`).returns(`.monitoring-${product}-N-*`)
                         .withArgs('xpack.monitoring.max_bucket_size').returns(size)
      }),
      plugins: {
        elasticsearch: {
          getCluster: sinon.stub().withArgs('monitoring').returns({ callWithRequest })
        }
      }
    }
  };
  const response = {
    hits: {
      hits: [
        {
          _source: {
            cluster_uuid: 'a',
            [`${product}_stats`]: {
              [`${product}`]: {
                version: '1.2.3-alpha1'
              }
            }
          }
        },
        {
          _source: {
            cluster_uuid: 'a',
            [`${product}_stats`]: {
              [`${product}`]: {
                version: '1.2.3-alpha1'
              }
            }
          }
        },
        {
          _source: {
            cluster_uuid: 'b',
            [`${product}_stats`]: {
              [`${product}`]: {
                version: '2.3.4-rc1'
              }
            }
          }
        },
        {
          _source: {
            cluster_uuid: 'b',
            [`${product}_stats`]: {
              [`${product}`]: {
                version: '2.3.4'
              }
            }
          }
        },
        // no version
        {
          _source: {
            cluster_uuid: 'b'
          }
        },
        // no cluster_uuid (not counted)
        {
          _source: {
            [`${product}_stats`]: {
              [`${product}`]: {
                version: '2.3.4'
              }
            }
          }
        }
      ]
    }
  };
  const expectedClusters = {
    a: {
      count: 2,
      versions: [
        { version: '1.2.3-alpha1', count: 2 }
      ]
    },
    b: {
      count: 3,
      versions: [
        { version: '2.3.4-rc1', count: 1 },
        { version: '2.3.4', count: 1 }
      ]
    }
  };
  const clusterUuids = Object.keys(expectedClusters);

  describe('getHighLevelStats', () => {
    it('returns clusters', async () => {
      callWithRequest.withArgs(req, 'count').returns(Promise.resolve({ status: 200 }));
      callWithRequest.withArgs(req, 'fieldStats').returns(Promise.resolve({ indices }));
      callWithRequest.withArgs(req, 'search').returns(Promise.resolve(response));

      expect(await getHighLevelStats(req, clusterUuids, start, end, product)).to.eql(expectedClusters);
    });
  });

  describe('fetchHighLevelStats', () => {
    it('does not search if indices is empty', async () => {
      expect(await fetchHighLevelStats(req, [], clusterUuids, start, end, product)).to.eql({});
    });

    it('searches for clusters', async () => {
      callWithRequest.returns(response);

      expect(await fetchHighLevelStats(req, indices, clusterUuids, start, end, product)).to.be(response);
    });
  });

  describe('handleHighLevelStatsResponse', () => {
    // filterPath makes it easy to ignore anything unexpected because it will come back empty
    it('handles unexpected response', () => {
      const clusters = handleHighLevelStatsResponse({}, product);

      expect(clusters).to.eql({});
    });

    it('handles valid response', () => {
      const clusters = handleHighLevelStatsResponse(response, product);

      expect(clusters).to.eql(expectedClusters);
    });

    it('handles no hits response', () => {
      const clusters = handleHighLevelStatsResponse({ hits: { hits: [ ] } }, product);

      expect(clusters).to.eql({});
    });
  });
});
