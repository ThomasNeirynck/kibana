/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { shallow } from 'enzyme';

import { TooltipSelector } from './tooltip_selector';


class MockField {
  constructor({ name, label, type }) {
    this._name = name;
    this._label = label;
    this._type = type;
  }

  getName() {
    return this._name;
  }

  async getLabel() {
    return this._label || 'foobar_label';
  }

  async getIndexPatternType() {
    return this._type || 'foobar_type';
  }
}

const defaultProps = {
  tooltipFields: [new MockField({ name: 'iso2' })],
  onChange: (()=>{}),
  fields: [
    new MockField({
      name: 'iso2',
      label: 'ISO 3166-1 alpha-2 code',
      type: 'string'
    }),
    new MockField({
      name: 'iso3',
      type: 'string'
    })
  ]
};

describe('TooltipSelector', () => {

  test('should render component', (done) => {

    const component = shallow(
      <TooltipSelector
        {...defaultProps}
      />
    );

    setTimeout(() => {
      component.update();
      expect(component)
        .toMatchSnapshot();
      done();
    });


  });

});
