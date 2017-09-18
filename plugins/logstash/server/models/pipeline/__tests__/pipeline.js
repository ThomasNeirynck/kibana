import expect from 'expect.js';
import { Pipeline } from '../pipeline';

describe('pipeline', () => {

  describe('Pipeline', () => {

    describe('fromUpstreamJSON factory method', () => {

      const upstreamJSON = {
        _id: 'apache',
        _source: {
          description: 'this is an apache pipeline',
          pipeline_metadata: {
            version: 1,
            type: 'logstash_pipeline'
          },
          username: 'elastic',
          pipeline: 'input {} filter { grok {} }\n output {}'
        }
      };

      it('returns correct Pipeline instance', () => {
        const pipeline = Pipeline.fromUpstreamJSON(upstreamJSON);
        expect(pipeline.id).to.be(upstreamJSON._id);
        expect(pipeline.description).to.be(upstreamJSON._source.description);
        expect(pipeline.username).to.be(upstreamJSON._source.username);
        expect(pipeline.pipeline).to.be(upstreamJSON._source.pipeline);
      });

    });

    describe('upstreamJSON getter method', () => {

      it('returns the upstream JSON', () => {
        const downstreamJSON = {
          id: 'apache',
          description: 'this is an apache pipeline',
          username: 'elastic',
          pipeline: 'input {} filter { grok {} }\n output {}'
        };
        const pipeline = new Pipeline(downstreamJSON);
        const expectedUpstreamJSON = {
          description: 'this is an apache pipeline',
          pipeline_metadata: {
            type: 'logstash_pipeline',
            version: 1
          },
          username: 'elastic',
          pipeline: 'input {} filter { grok {} }\n output {}'
        };
        // can't do an object level comparision because modified field is always `now`
        expect(pipeline.upstreamJSON.last_modified).to.be.a('string');
        expect(pipeline.upstreamJSON.description).to.be(expectedUpstreamJSON.description);
        expect(pipeline.upstreamJSON.pipeline_metadata).to.eql(expectedUpstreamJSON.pipeline_metadata);
        expect(pipeline.upstreamJSON.pipeline).to.be(expectedUpstreamJSON.pipeline);
      });

    });

  });

});
