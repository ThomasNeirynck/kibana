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

import _ from 'lodash';
import expect from 'expect.js';
import { validateCardinality } from '../validate_cardinality';

import mockFareQuoteCardinality from './mock_farequote_cardinality';

// mock callWithRequestFactory
const callWithRequestFactory = (mockSearchResponse) => {
  return () => {
    return new Promise((resolve) => {
      resolve(mockSearchResponse);
    });
  };
};

describe('ML - validateCardinality', () => {

  it('called without arguments', (done) => {
    validateCardinality(callWithRequestFactory(mockFareQuoteCardinality)).then(
      () => done(new Error('Promise should not resolve for this test without job argument.')),
      () => done()
    );
  });

  it('called with non-valid job argument #1, missing analysis_config', (done) => {
    validateCardinality(callWithRequestFactory(mockFareQuoteCardinality), {}).then(
      () => done(new Error('Promise should not resolve for this test without valid job argument.')),
      () => done()
    );
  });

  it('called with non-valid job argument #2, missing datafeed_config', (done) => {
    validateCardinality(callWithRequestFactory(mockFareQuoteCardinality), { analysis_config: {} }).then(
      () => done(new Error('Promise should not resolve for this test without valid job argument.')),
      () => done()
    );
  });

  it('called with non-valid job argument #3, missing datafeed_config.indices', (done) => {
    const job = { analysis_config: {}, datafeed_config: {} };
    validateCardinality(callWithRequestFactory(mockFareQuoteCardinality), job).then(
      () => done(new Error('Promise should not resolve for this test without valid job argument.')),
      () => done()
    );
  });

  it('called with non-valid job argument #4, missing data_description', (done) => {
    const job = { analysis_config: {}, datafeed_config: { indices: [] } };
    validateCardinality(callWithRequestFactory(mockFareQuoteCardinality), job).then(
      () => done(new Error('Promise should not resolve for this test without valid job argument.')),
      () => done()
    );
  });

  it('called with non-valid job argument #5, missing data_description.time_field', (done) => {
    const job = { analysis_config: {}, data_description: {}, datafeed_config: { indices: [] } };
    validateCardinality(
      callWithRequestFactory(mockFareQuoteCardinality), job).then(
      () => done(new Error('Promise should not resolve for this test without valid job argument.')),
      () => done()
    );
  });

  it('called with non-valid job argument #6, missing analysis_config.influencers', (done) => {
    const job = {
      analysis_config: {}, datafeed_config: { indices: [] }, data_description: { time_field: '@timestamp' }
    };
    validateCardinality(callWithRequestFactory(mockFareQuoteCardinality), job).then(
      () => done(new Error('Promise should not resolve for this test without valid job argument.')),
      () => done()
    );
  });

  it('minimum job configuraton to pass cardinality check code', () => {
    const job = {
      analysis_config: { detectors: [], influencers: [] },
      data_description: { time_field: '@timestamp' },
      datafeed_config: {
        indices: []
      }
    };

    return validateCardinality(callWithRequestFactory(mockFareQuoteCardinality), job).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids).to.eql(['success_cardinality']);
      }
    );
  });

  const getJobConfig = (fieldName) => ({
    analysis_config: {
      detectors: [
        {
          function: 'count',
          [fieldName]: 'airline'
        }
      ],
      influencers: []
    },
    data_description: { time_field: '@timestamp' },
    datafeed_config: {
      indices: []
    }
  });

  const testCardinality = (fieldName, cardinality, test) => {
    const job = getJobConfig(fieldName);
    const mockCardinality = _.cloneDeep(mockFareQuoteCardinality);
    mockCardinality.aggregations.airline_cardinality.value = cardinality;
    return validateCardinality(callWithRequestFactory(mockCardinality), job, {}).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        test(ids);
      }
    );
  };

  it('field not aggregatable', () => {
    const job = getJobConfig('partition_field_name');
    return validateCardinality(callWithRequestFactory({}), job).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids).to.eql(['field_not_aggregatable']);
      }
    );
  });

  it('valid partition field cardinality', () => {
    return testCardinality('partition_field_name', 50, (ids) => {
      expect(ids).to.eql(['success_cardinality']);
    });
  });

  it('too high partition field cardinality', () => {
    return testCardinality('partition_field_name', 1001, (ids) => {
      expect(ids).to.eql(['cardinality_partition_field']);
    });
  });

  it('valid by field cardinality', () => {
    return testCardinality('by_field_name', 50, (ids) => {
      expect(ids).to.eql(['success_cardinality']);
    });
  });

  it('too high by field cardinality', () => {
    return testCardinality('by_field_name', 1001, (ids) => {
      expect(ids).to.eql(['cardinality_by_field']);
    });
  });

  it('valid over field cardinality', () => {
    return testCardinality('over_field_name', 50, (ids) => {
      expect(ids).to.eql(['success_cardinality']);
    });
  });

  it('too low over field cardinality', () => {
    return testCardinality('over_field_name', 9, (ids) => {
      expect(ids).to.eql(['cardinality_over_field_low']);
    });
  });

  it('too high over field cardinality', () => {
    return testCardinality('over_field_name', 1000001, (ids) => {
      expect(ids).to.eql(['cardinality_over_field_high']);
    });
  });

});
