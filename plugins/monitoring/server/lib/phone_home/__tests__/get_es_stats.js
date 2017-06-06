import expect from 'expect.js';
import sinon from 'sinon';
import { fetchElasticsearchStats, getElasticsearchStats, handleElasticsearchStats } from '../get_es_stats';

describe('get_es_stats', () => {
  const callWithRequest = sinon.stub();
  const size = 123;
  const req = {
    server: {
      config: sinon.stub().returns({
        get: sinon.stub().withArgs('xpack.monitoring.elasticsearch.index_pattern').returns('.monitoring-es-N-*')
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
        { _id: 'abc', _source: { cluster_uuid: 'abc' } },
        { _id: 'xyz', _source: { cluster_uuid: 'xyz' } },
        { _id: '123', _source: { cluster_uuid: '123' } }
      ]
    }
  };
  const expectedClusters = response.hits.hits.map(hit => hit._source);
  const clusterUuids = expectedClusters.map(cluster => cluster.cluster_uuid);

  describe('getElasticsearchStats', () => {
    it('returns clusters', async () => {
      callWithRequest.withArgs(req, 'search').returns(Promise.resolve(response));

      expect(await getElasticsearchStats(req, clusterUuids)).to.eql(expectedClusters);
    });
  });

  describe('fetchElasticsearchStats', () => {
    it('searches for clusters', async () => {
      callWithRequest.returns(response);

      expect(await fetchElasticsearchStats(req, clusterUuids)).to.be(response);
    });
  });

  describe('handleElasticsearchStats', () => {
    // filterPath makes it easy to ignore anything unexpected because it will come back empty
    it('handles unexpected response', () => {
      const clusters = handleElasticsearchStats({});

      expect(clusters.length).to.be(0);
    });

    it('handles valid response', () => {
      const clusters = handleElasticsearchStats(response);

      expect(clusters).to.eql(expectedClusters);
    });

    it('handles no hits response', () => {
      const clusters = handleElasticsearchStats({ hits: { hits: [] } });

      expect(clusters.length).to.be(0);
    });
  });
});
