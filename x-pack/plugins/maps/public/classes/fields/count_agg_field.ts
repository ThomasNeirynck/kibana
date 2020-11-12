/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { IndexPattern } from 'src/plugins/data/public';
import { IESAggSource } from '../sources/es_agg_source';
import { IVectorSource } from '../sources/vector_source';
import { AGG_TYPE, FIELD_ORIGIN } from '../../../common/constants';
import { ITooltipProperty, TooltipProperty } from '../tooltips/tooltip_property';
import { ESAggTooltipProperty } from '../tooltips/es_agg_tooltip_property';
import { IESAggField, IESAggFieldParams } from './agg_field_types';

const TERMS_AGG_SHARD_SIZE = 5;

// Agg without field. Essentially a count-aggregation.
export class CountAggField implements IESAggField {
  private readonly _source: IESAggSource;
  private readonly _origin: FIELD_ORIGIN;
  private readonly _label?: string;
  private readonly _canReadFromGeoJson: boolean;

  constructor({ label, source, origin, canReadFromGeoJson = true }: IESAggFieldParams) {
    this._source = source;
    this._origin = origin;
    this._label = label;
    this._canReadFromGeoJson = canReadFromGeoJson;
  }

  getSource(): IVectorSource {
    return this._source;
  }

  getOrigin(): FIELD_ORIGIN {
    return this._origin;
  }

  getName(): string {
    return this._source.getAggKey(this.getAggType(), this.getRootName());
  }

  getRootName(): string {
    return this._getESDocFieldName();
  }

  async getLabel(): Promise<string> {
    return this._label
      ? this._label
      : this._source.getAggLabel(this.getAggType(), this.getRootName());
  }

  getAggType(): AGG_TYPE {
    return AGG_TYPE.COUNT;
  }

  isValid(): boolean {
    return true;
  }

  async getDataType(): Promise<string> {
    return this.getAggType() === AGG_TYPE.TERMS ? 'string' : 'number';
  }

  _getESDocFieldName(): string {
    return '';
  }

  async createTooltipProperty(value: string | string[] | undefined): Promise<ITooltipProperty> {
    const indexPattern = await this._source.getIndexPattern();
    const tooltipProperty = new TooltipProperty(this.getName(), await this.getLabel(), value);
    return new ESAggTooltipProperty(tooltipProperty, indexPattern, this, this.getAggType());
  }

  getValueAggDsl(indexPattern: IndexPattern): unknown | null {
    return null;
  }

  getBucketCount(): number {
    // terms aggregation increases the overall number of buckets per split bucket
    return this.getAggType() === AGG_TYPE.TERMS ? TERMS_AGG_SHARD_SIZE : 0;
  }

  supportsFieldMeta(): boolean {
    // count and sum aggregations are not within field bounds so they do not support field meta.
    return false;
  }

  canValueBeFormatted(): boolean {
    return false;
  }

  async getOrdinalFieldMetaRequest(): Promise<unknown> {
    return null;
  }

  async getCategoricalFieldMetaRequest(size: number): Promise<unknown> {
    return null;
  }

  supportsAutoDomain(): boolean {
    return this._canReadFromGeoJson ? true : this.supportsFieldMeta();
  }

  canReadFromGeoJson(): boolean {
    return this._canReadFromGeoJson;
  }
}
