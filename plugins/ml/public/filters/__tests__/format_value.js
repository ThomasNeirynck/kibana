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

import ngMock from 'ng_mock';
import expect from 'expect.js';
import moment from 'moment';

let filter;

const init = function () {
  // Load the application
  ngMock.module('kibana');

  // Create the scope
  ngMock.inject(function ($filter) {
    filter = $filter('formatValue');
  });
};

describe('ML - formatValue filter', function () {

  beforeEach(function () {
    init();
  });

  it('should have a formatValue filter', function () {
    expect(filter).to.not.be(null);
  });

  // Just check the return value is in the expected format, and
  // not the exact value as this will be timezone specific.
  it('correctly formats time_of_week value from numeric input', function () {
    const formattedValue = filter(1483228800, 'time_of_week');
    const result = moment(formattedValue, 'ddd hh:mm', true).isValid();
    expect(result).to.be(true);
  });

  it('correctly formats time_of_day value from numeric input', function () {
    const formattedValue = filter(1483228800, 'time_of_day');
    const result = moment(formattedValue, 'hh:mm', true).isValid();
    expect(result).to.be(true);
  });

  it('correctly formats number value from numeric input', function () {
    expect(filter(1483228800, 'mean')).to.be(1483228800);
  });

  it('correctly formats time_of_week value from array input', function () {
    const formattedValue = filter([1483228800], 'time_of_week');
    const result = moment(formattedValue, 'ddd hh:mm', true).isValid();
    expect(result).to.be(true);
  });

  it('correctly formats time_of_day value from array input', function () {
    const formattedValue = filter([1483228800], 'time_of_day');
    const result = moment(formattedValue, 'hh:mm', true).isValid();
    expect(result).to.be(true);
  });

  it('correctly formats number value from array input', function () {
    expect(filter([1483228800], 'mean')).to.be(1483228800);
  });

  it('correctly formats multi-valued array', function () {
    const result = filter([500, 1000], 'mean');
    expect(result instanceof Array).to.be(true);
    expect(result.length).to.be(2);
    expect(result[0]).to.be(500);
    expect(result[1]).to.be(1000);
  });

});
