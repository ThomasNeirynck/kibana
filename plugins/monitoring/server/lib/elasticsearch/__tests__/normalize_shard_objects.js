import expect from 'expect.js';
import { getDefaultDataObject, normalizeIndexShards, normalizeNodeShards } from '../normalize_shard_objects';

function getIndexShardBucket() {
  return {
    // the index name being something we actually don't expect is intentional to ensure the object is not colliding
    key: 'nodes',
    doc_count: 5,
    states: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: [
        {
          key: 'STARTED',
          doc_count: 1,
          primary: {
            doc_count_error_upper_bound: 0,
            sum_other_doc_count: 0,
            buckets: [{ key: 1, key_as_string: 'true', doc_count: 1 }]
          }
        },
        {
          key: 'RELOCATING',
          doc_count: 1,
          primary: {
            doc_count_error_upper_bound: 0,
            sum_other_doc_count: 0,
            buckets: [{ key: 1, key_as_string: 'true', doc_count: 1 }]
          }
        },
        {
          key: 'INITIALIZING',
          doc_count: 1,
          primary: {
            doc_count_error_upper_bound: 0,
            sum_other_doc_count: 0,
            buckets: [{ key: 1, key_as_string: 'true', doc_count: 1 }]
          }
        },
        {
          key: 'UNASSIGNED',
          doc_count: 2,
          primary: {
            doc_count_error_upper_bound: 0,
            sum_other_doc_count: 0,
            buckets: [{ key: 0, key_as_string: 'false', doc_count: 2 }]
          }
        }
      ]
    }
  };
}

function getNodeShardBucket() {
  return {
    key: '127.0.0.1:9301',
    doc_count: 3,
    node_transport_address: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: [
        {
          key: '127.0.0.1:9301',
          doc_count: 3,
          max_timestamp: {
            value: 1457561181492,
            value_as_string: '2016-03-09T22:06:21.492Z'
          }
        }
      ]
    },
    node_names: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: [
        {
          key: 'Spider-Woman',
          doc_count: 3,
          max_timestamp: {
            value: 1457561181492,
            value_as_string: '2016-03-09T22:06:21.492Z'
          }
        }
      ]
    },
    node_data_attributes: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: []
    },
    node_master_attributes: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: []
    },
    node_ids: {
      doc_count_error_upper_bound: 0,
      sum_other_doc_count: 0,
      buckets: [
        {
          key: 'TqvymHFlQUWIxPGIsIBkTA',
          doc_count: 3
        }
      ]
    },
    index_count: {
      value: 3
    }
  };
}

describe('Normalizing Shard Data', () => {
  describe('Index Shards', () => {
    it('Calculates the Index Shard data for a result bucket', () => {
      const data = getDefaultDataObject();
      const resultFn = normalizeIndexShards(data.indices);
      resultFn(getIndexShardBucket());

      // Note: the existence of relocating shards is effectively ignored.
      // Relocating shards do not matter until they have STARTED, at which point the relocated shard
      // is deleted, so the count stays the same!
      expect(data.indices.totals.primary).to.be.eql(1);
      expect(data.indices.totals.replica).to.be.eql(0);
      expect(data.indices.totals.unassigned.primary).to.be.eql(1);
      expect(data.indices.totals.unassigned.replica).to.be.eql(2);
      // 'nodes' is the index name!
      expect(data.indices.nodes.status).to.be.eql('red');
      expect(data.indices.nodes.primary).to.be.eql(1);
      expect(data.indices.nodes.replica).to.be.eql(0);
      expect(data.indices.nodes.unassigned.primary).to.be.eql(1);
      expect(data.indices.nodes.unassigned.replica).to.be.eql(2);
    });
  });

  describe('Node Shards', () => {
    it('Calculates the Node Shard data for a result bucket', () => {
      const data = getDefaultDataObject();
      const resultFn = normalizeNodeShards(data.nodes, 'transport_address');
      resultFn(getNodeShardBucket());

      expect(data.nodes).to.be.an('object');
      expect(data.nodes).to.only.have.key('127.0.0.1:9301');
    });
  });
});
