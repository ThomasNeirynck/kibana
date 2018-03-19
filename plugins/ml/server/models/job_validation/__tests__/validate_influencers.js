/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

import expect from 'expect.js';
import { validateInfluencers } from '../validate_influencers';

describe('ML - validateInfluencers', () => {

  it('called without arguments throws an error', (done) => {
    validateInfluencers().then(
      () => done(new Error('Promise should not resolve for this test without job argument.')),
      () => done()
    );
  });

  it('called with non-valid job argument #1, missing analysis_config', (done) => {
    validateInfluencers(undefined, {}).then(
      () => done(new Error('Promise should not resolve for this test without valid job argument.')),
      () => done()
    );
  });

  it('called with non-valid job argument #2, missing analysis_config.influencers', (done) => {
    const job = {
      analysis_config: {}, datafeed_config: { indices: [] }, data_description: { time_field: '@timestamp' }
    };
    validateInfluencers(undefined, job).then(
      () => done(new Error('Promise should not resolve for this test without valid job argument.')),
      () => done()
    );
  });

  it('called with non-valid job argument #3, missing analysis_config.detectors', (done) => {
    const job = {
      analysis_config: { influencers: [] },
      datafeed_config: { indices: [] },
      data_description: { time_field: '@timestamp' }
    };
    validateInfluencers(undefined, job).then(
      () => done(new Error('Promise should not resolve for this test without valid job argument.')),
      () => done()
    );
  });

  const getJobConfig = (influencers = [], detectors = []) => ({
    analysis_config: { detectors, influencers },
    data_description: { time_field: '@timestamp' },
    datafeed_config: {
      indices: []
    }
  });

  it('success_influencer', () => {
    const job = getJobConfig(['airline']);
    return validateInfluencers(undefined, job).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids).to.eql(['success_influencers']);
      }
    );
  });

  it('influencer_low', () => {
    const job = getJobConfig();
    return validateInfluencers(undefined, job).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids).to.eql(['influencer_low']);
      }
    );
  });

  it('influencer_high', () => {
    const job = getJobConfig([
      'i1', 'i2', 'i3', 'i4'
    ]);
    return validateInfluencers(undefined, job).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids).to.eql(['influencer_high']);
      }
    );
  });

  it('influencer_suggestion', () => {
    const job = getJobConfig(
      [],
      [{
        detector_description: 'count',
        function: 'count',
        partition_field_name: 'airline',
        rules: [],
        detector_index: 0
      }]
    );
    return validateInfluencers(undefined, job).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids).to.eql(['influencer_low_suggestion']);
      }
    );
  });

  it('influencer_suggestions', () => {
    const job = getJobConfig(
      [],
      [{
        detector_description: 'count',
        function: 'count',
        partition_field_name: 'airline',
        rules: [],
        detector_index: 0
      },
      {
        detector_description: 'count',
        function: 'count',
        by_field_name: 'airline1',
        rules: [],
        detector_index: 0
      }]
    );
    return validateInfluencers(undefined, job).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids).to.eql(['influencer_low_suggestions']);
      }
    );
  });

});
