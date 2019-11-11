/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */


import { FIELD_ORIGIN } from '../../../common/constants';

export class AbstractField {

  constructor({ fieldName, source }) {
    this._fieldName = fieldName;
    this._source = source;
  }

  getName() {
    return this._fieldName;
  }

  isValid() {
    return !!this._fieldName;
  }

  async getIndexPatternType() {
    return 'string';
  }

  async getLabel() {
    return this._fieldName;
  }

  async createTooltipProperty() {
    throw new Error('must implement Field#createTooltipProperty');
  }

  getOrigin() {
    return FIELD_ORIGIN.UNDEFINED;
  }
}









