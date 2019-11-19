/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */


import { AbstractField } from './field';
import { COUNT_AGG_TYPE } from '../../../common/constants';
import { ESAggMetricTooltipProperty } from '../tooltips/es_aggmetric_tooltip_property';

export class ESAggMetricField extends AbstractField {

  static type = 'ES_AGG';

  constructor({ label, source, aggType, esDocField }) {
    super({ source });
    this._label = label;
    this._aggType = aggType;
    this._esDocField = esDocField;
  }

  getName() {
    return this._source.formatMetricKey(this.getAggType(), this.getESDocFieldName());
  }

  async getLabel() {
    return this._label ? this._label : this._source.formatMetricLabel(this.getAggType(), this.getESDocFieldName());
  }

  getAggType() {
    return this._aggType;
  }

  isValid() {
    return (this.getAggType() === COUNT_AGG_TYPE) ? true : !!this._esDocField;
  }

  getESDocFieldName() {
    return this._esDocField ? this._esDocField.getName() : '';
  }

  getRequestDescription() {
    return this.getAggType() !== COUNT_AGG_TYPE ? `${this.getAggType()} ${this.getESDocFieldName()}` : COUNT_AGG_TYPE;
  }

  async createTooltipProperty(value) {
    const indexPattern = await this._source.getIndexPattern();
    return new ESAggMetricTooltipProperty(
      this.getName(),
      await this.getLabel(),
      value,
      indexPattern,
      this
    );
  }


  makeMetricAggConfig() {
    const metricAggConfig = {
      id: this.getName(),
      enabled: true,
      type: this.getAggType(),
      schema: 'metric',
      params: {}
    };
    if (this.getAggType() !== COUNT_AGG_TYPE) {
      metricAggConfig.params = { field: this.getESDocFieldName() };
    }
    return metricAggConfig;
  }
}
