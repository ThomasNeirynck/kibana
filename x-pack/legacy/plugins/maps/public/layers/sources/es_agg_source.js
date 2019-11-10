/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { AbstractESSource } from './es_source';
import { ESAggMetricTooltipProperty } from '../tooltips/es_aggmetric_tooltip_property';
import { ESAggMetricField } from '../fields/es_agg_field';
import { ESDocField } from '../fields/es_doc_field';
import { METRIC_TYPE, COUNT_AGG_TYPE, COUNT_PROP_LABEL, COUNT_PROP_NAME } from '../../../common/constants';


const AGG_DELIMITER = '_of_';

export class AbstractESAggSource extends AbstractESSource {

  static METRIC_SCHEMA_CONFIG = {
    group: 'metrics',
    name: 'metric',
    title: 'Value',
    min: 1,
    max: Infinity,
    aggFilter: [
      METRIC_TYPE.AVG,
      METRIC_TYPE.COUNT,
      METRIC_TYPE.MAX,
      METRIC_TYPE.MIN,
      METRIC_TYPE.SUM,
      METRIC_TYPE.UNIQUE_COUNT
    ],
    defaults: [
      { schema: 'metric', type: METRIC_TYPE.COUNT }
    ]
  };

  constructor(descriptor, inspectorAdapters) {
    super(descriptor, inspectorAdapters);
    this._metricFields = this._descriptor.metrics ? this._descriptor.metrics.map(metric => {
      const esDocField = metric.field ? new ESDocField({ fieldName: metric.field, source: this }) : null;
      return new ESAggMetricField({
        label: metric.label,
        esDocField: esDocField,
        aggType: metric.type,
        source: this
      });
    }) : [];
  }

  createField({ fieldName, label }) {
    if (fieldName === COUNT_PROP_NAME) {
      return new ESAggMetricField({
        aggType: COUNT_AGG_TYPE,
        label: label,
        source: this
      });
    } else {
      //this only works because aggType is a fixed set and does not include the `_of_` string
      const [aggType, docField] = fieldName.split(AGG_DELIMITER);
      const esDocField = new ESDocField({ fieldName: docField, source: this });
      return new ESAggMetricField({
        label: label,
        esDocField,
        aggType,
        source: this
      });
    }
  }

  getMetricFieldForName(fieldName) {
    return this._metricFields.find(metricField => {
      return metricField.getName() === fieldName;
    });
  }

  getMetricFields() {
    const metrics = this._metricFields.filter(esAggField => esAggField.isValid());
    if (metrics.length === 0) {
      metrics.push(new ESAggMetricField({
        aggType: COUNT_AGG_TYPE,
        source: this
      }));
    }
    return metrics;
  }

  formatMetricKey(aggType, fieldName) {
    return aggType !== COUNT_AGG_TYPE ? `${aggType}${AGG_DELIMITER}${fieldName}` : COUNT_PROP_NAME;
  }

  formatMetricLabel(aggType, fieldName) {
    return aggType !== COUNT_AGG_TYPE ? `${aggType} of ${fieldName}` : COUNT_PROP_LABEL;
  }

  createMetricAggConfigs() {
    return this.getMetricFields().map(esAggMetric => esAggMetric.makeMetricAggConfig());
  }


  async getNumberFields() {
    return this.getMetricFields();
  }

  async filterAndFormatPropertiesToHtmlForMetricFields(properties) {
    let indexPattern;
    try {
      indexPattern = await this.getIndexPattern();
    } catch(error) {
      console.warn(`Unable to find Index pattern ${this._descriptor.indexPatternId}, values are not formatted`);
      return properties;
    }

    const metricFields = this.getMetricFields();
    const tooltipPropertiesPromises = [];
    metricFields.forEach(async (metricField) => {
      let value;
      for (const key in properties) {
        if (properties.hasOwnProperty(key) && metricField.getName() === key) {
          value = properties[key];
          break;
        }
      }

      const tooltipProperty  = new ESAggMetricTooltipProperty(
        metricField.getName(),
        await metricField.getLabel(),
        value,
        indexPattern,
        metricField
      );
      tooltipPropertiesPromises.push(tooltipProperty);
    });

    return Promise.all(tooltipPropertiesPromises);
  }
}
