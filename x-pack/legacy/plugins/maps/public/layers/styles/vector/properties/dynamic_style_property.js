/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import _ from 'lodash';
import { AbstractStyleProperty } from './style_property';
import { DEFAULT_SIGMA } from '../vector_style_defaults';
import { STYLE_TYPE } from '../../../../../common/constants';
import { scaleValue } from '../style_util';
import React from 'react';
import { OrdinalLegend } from './components/ordinal_legend';
import { CategoricalLegend } from './components/categorical_legend';

export class DynamicStyleProperty extends AbstractStyleProperty {
  static type = STYLE_TYPE.DYNAMIC;

  constructor(options, styleName, field, getFieldMeta, getFieldFormatter) {
    super(options, styleName);
    this._field = field;
    this._getFieldMeta = getFieldMeta;
    this._getFieldFormatter = getFieldFormatter;
  }

  getFieldMeta() {
    return this._getFieldMeta && this._field ? this._getFieldMeta(this._field.getName()) : null;
  }

  getField() {
    return this._field;
  }

  isDynamic() {
    return true;
  }

  isOrdinal() {
    return true;
  }

  isCategorical() {
    return false;
  }

  hasBreaks() {
    return false;
  }

  isRanged() {
    return true;
  }

  isComplete() {
    return !!this._field;
  }

  getFieldOrigin() {
    return this._field.getOrigin();
  }

  isFieldMetaEnabled() {
    const fieldMetaOptions = this.getFieldMetaOptions();
    return this.supportsFieldMeta() && _.get(fieldMetaOptions, 'isEnabled', true);
  }

  supportsFieldMeta() {
    return this.isComplete() && this.isScaled() && this._field.supportsFieldMeta();
  }

  async getFieldMetaRequest() {
    if (this.isOrdinal()) {
      const fieldMetaOptions = this.getFieldMetaOptions();
      return this._field.getOrdinalFieldMetaRequest({
        sigma: _.get(fieldMetaOptions, 'sigma', DEFAULT_SIGMA),
      });
    } else if (this.isCategorical()) {
      return this._field.getCategoricalFieldMetaRequest();
    } else {
      return null;
    }
  }

  supportsFeatureState() {
    return true;
  }

  isScaled() {
    return true;
  }

  getFieldMetaOptions() {
    return _.get(this.getOptions(), 'fieldMetaOptions', {});
  }

  _pluckOrdinalMetaFromFeatures(features) {
    const name = this.getField().getName();
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const newValue = parseFloat(feature.properties[name]);
      if (!isNaN(newValue)) {
        min = Math.min(min, newValue);
        max = Math.max(max, newValue);
      }
    }

    return min === Infinity || max === -Infinity
      ? null
      : {
          min: min,
          max: max,
          delta: max - min,
        };
  }

  _pluckCategoricalMetaFromFeatures(features) {
    const fieldName = this.getField().getName();
    const counts = new Map();
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const term = feature.properties[fieldName];
      if (counts.has(term)) {
        counts.set(term, counts.get(term) + 1);
      } else {
        counts.set(term, 1);
      }
    }

    const ordered = [];
    for (const [key, value] of counts) {
      ordered.push({ key, count: value });
    }

    ordered.sort((a, b) => {
      return a.count > b.count;
    });

    const truncated = ordered.slice(0, 10);
    console.log('tr', truncated);
    return {
      categories: truncated,
    };
  }

  pluckStyleMetaFromFeatures(features) {
    if (this.isOrdinal()) {
      return this._pluckOrdinalMetaFromFeatures(features);
    } else if (this.isCategorical()) {
      return this._pluckCategoricalMetaFromFeatures(features);
    } else {
      return null;
    }
  }

  _pluckOrdinalStyleMetaFromFieldMetaData(fieldMetaData) {
    const realFieldName = this._field.getESDocFieldName
      ? this._field.getESDocFieldName()
      : this._field.getName();
    const stats = fieldMetaData[realFieldName];
    if (!stats) {
      return null;
    }

    const sigma = _.get(this.getFieldMetaOptions(), 'sigma', DEFAULT_SIGMA);
    const stdLowerBounds = stats.avg - stats.std_deviation * sigma;
    const stdUpperBounds = stats.avg + stats.std_deviation * sigma;
    const min = Math.max(stats.min, stdLowerBounds);
    const max = Math.min(stats.max, stdUpperBounds);
    return {
      min,
      max,
      delta: max - min,
      isMinOutsideStdRange: stats.min < stdLowerBounds,
      isMaxOutsideStdRange: stats.max > stdUpperBounds,
    };
  }

  _pluckCategoricalStyleMetaFromFieldMetaData(fieldMetaData) {
    console.log(fieldMetaData);
    const name = this.getField().getName();
    if (!fieldMetaData[name] || !fieldMetaData[name].buckets) {
      return null;
    }

    const ordered = fieldMetaData[name].buckets.map(bucket => {
      return {
        key: bucket.key,
        count: bucket.doc_count,
      };
    });
    return ordered;
  }

  pluckStyleMetaFromFieldMetaData(fieldMetaData) {
    if (this.isOrdinal()) {
      return this._pluckOrdinalStyleMetaFromFieldMetaData();
    } else if (this.isCategorical()) {
      return this._pluckCategoricalStyleMetaFromFieldMetaData(fieldMetaData);
    } else {
      return null;
    }
  }

  formatField(value) {
    if (this.getField()) {
      const fieldName = this.getField().getName();
      const fieldFormatter = this._getFieldFormatter(fieldName);
      return fieldFormatter ? fieldFormatter(value) : value;
    } else {
      return value;
    }
  }

  getMbValue(value) {
    if (!this.isOrdinal()) {
      return this.formatField(value);
    }

    const valueAsFloat = parseFloat(value);
    if (this.isScaled()) {
      return scaleValue(valueAsFloat, this.getFieldMeta());
    }
    if (isNaN(valueAsFloat)) {
      return 0;
    }
    return valueAsFloat;
  }

  renderBreakedLegend() {
    return null;
  }

  _renderCategoricalLegend({ loadIsPointsOnly, loadIsLinesOnly, symbolId }) {
    return (
      <CategoricalLegend
        style={this}
        loadIsLinesOnly={loadIsLinesOnly}
        loadIsPointsOnly={loadIsPointsOnly}
        symbolId={symbolId}
      />
    );
  }

  _renderRangeLegend() {
    return <OrdinalLegend style={this} />;
  }

  renderLegendDetailRow({ loadIsPointsOnly, loadIsLinesOnly, symbolId }) {
    if (this.isRanged()) {
      return this._renderRangeLegend();
    } else if (this.hasBreaks()) {
      return this._renderCategoricalLegend({ loadIsPointsOnly, loadIsLinesOnly, symbolId });
    } else {
      return null;
    }
  }
}
