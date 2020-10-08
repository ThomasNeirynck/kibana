/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

// @ts-expect-error
import * as topojson from 'topojson-client';
import _ from 'lodash';
import { i18n } from '@kbn/i18n';

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { FeatureCollection, GeoJsonProperties } from 'geojson';
import { Filter, TimeRange } from 'src/plugins/data/public';
import { FORMAT_TYPE, VECTOR_SHAPE_TYPE } from '../../../../common/constants';
import { TooltipProperty, ITooltipProperty } from '../../tooltips/tooltip_property';
import { AbstractSource, ISource } from '../source';
import { IField } from '../../fields/field';
import {
  ESSearchSourceResponseMeta,
  MapExtent,
  MapFilters,
  MapQuery,
  VectorSourceRequestMeta,
  VectorSourceSyncMeta,
} from '../../../../common/descriptor_types';
import { DataRequest } from '../../util/data_request';

export interface SourceTooltipConfig {
  tooltipContent: string | null;
  areResultsTrimmed: boolean;
}

export type GeoJsonFetchMeta = ESSearchSourceResponseMeta;

export type GeoJsonWithMeta = {
  data: FeatureCollection;
  meta?: GeoJsonFetchMeta;
};

export type BoundsFilters = {
  applyGlobalQuery: boolean;
  filters: Filter[];
  query?: MapQuery;
  sourceQuery?: MapQuery;
  timeFilters: TimeRange;
};

export interface IVectorSource extends ISource {
  getTooltipProperties(properties: GeoJsonProperties): Promise<ITooltipProperty[]>;
  getBoundsForFilters(
    boundsFilters: BoundsFilters,
    registerCancelCallback: (callback: () => void) => void
  ): Promise<MapExtent | null>;
  getGeoJsonWithMeta(
    layerName: string,
    searchFilters: MapFilters,
    registerCancelCallback: (callback: () => void) => void,
    isRequestStillActive: () => boolean
  ): Promise<GeoJsonWithMeta>;

  getFields(): Promise<IField[]>;
  getFieldByName(fieldName: string): IField | null;
  getLeftJoinFields(): Promise<IField[]>;
  getSyncMeta(): VectorSourceSyncMeta;
  getFieldNames(): string[];
  getApplyGlobalQuery(): boolean;
  createField({ fieldName }: { fieldName: string }): IField;
  canFormatFeatureProperties(): boolean;
  getSupportedShapeTypes(): Promise<VECTOR_SHAPE_TYPE[]>;
  isBoundsAware(): boolean;
  getSourceTooltipContent(sourceDataRequest?: DataRequest): SourceTooltipConfig;
}

export interface ITiledSingleLayerVectorSource extends IVectorSource {
  getUrlTemplateWithMeta(
    searchFilters: VectorSourceRequestMeta
  ): Promise<{
    layerName: string;
    urlTemplate: string;
    minSourceZoom: number;
    maxSourceZoom: number;
  }>;
  getMinZoom(): number;
  getMaxZoom(): number;
  getLayerName(): string;
}

export class AbstractVectorSource extends AbstractSource {
  protected readonly _tooltipFields: IField[];

  static async getGeoJson({
    format,
    featureCollectionPath,
    fetchUrl,
  }: {
    format: FORMAT_TYPE;
    featureCollectionPAth: string;
    fetchUrl: string;
  }) {
    let fetchedJson;
    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error('Request failed');
      }
      fetchedJson = await response.json();
    } catch (e) {
      throw new Error(
        i18n.translate('xpack.maps.source.vetorSource.requestFailedErrorMessage', {
          defaultMessage: `Unable to fetch vector shapes from url: {fetchUrl}`,
          values: { fetchUrl },
        })
      );
    }

    if (format === FORMAT_TYPE.GEOJSON) {
      return fetchedJson;
    }

    if (format === FORMAT_TYPE.TOPOJSON) {
      const features = _.get(fetchedJson, `objects.${featureCollectionPath}`);
      return topojson.feature(fetchedJson, features);
    }

    throw new Error(
      i18n.translate('xpack.maps.source.vetorSource.formatErrorMessage', {
        defaultMessage: `Unable to fetch vector shapes from url: {format}`,
        values: { format },
      })
    );
  }

  /**
   * factory function creating a new field-instance
   * @param fieldName
   * @param label
   * @returns {IField}
   */
  createField({ fieldName }: { fieldName: string }) {
    throw new Error(`Should implemement AbstractVectorSource#createField`);
  }

  getFieldNames() {
    return [];
  }

  /**
   * Retrieves a field. This may be an existing instance.
   * @param fieldName
   * @param label
   * @returns {IField}
   */
  getFieldByName(fieldName: string): IField | null {
    return this.createField({ fieldName: name });
  }

  _getTooltipPropertyNames() {
    return this._tooltipFields.map((field: IField) => field.getName());
  }

  isFilterByMapBounds() {
    return false;
  }

  isBoundsAware() {
    return false;
  }

  getBoundsForFilters(
    boundsFilters: BoundsFilters,
    registerCancelCallback: (callback: () => void) => void
  ): Promise<MapExtent | null>;

  async getFields() {
    return [];
  }

  async getLeftJoinFields() {
    return [];
  }

  async getGeoJsonWithMeta(
    layerName: string,
    searchFilters: MapFilters,
    registerCancelCallback: (callback: () => void) => void,
    isRequestStillActive: () => boolean
  ): Promise<GeoJsonWithMeta> {
    throw new Error('Should implement VectorSource#getGeoJson');
  }

  canFormatFeatureProperties() {
    return false;
  }

  // Allow source to filter and format feature properties before displaying to user
  async getTooltipProperties(properties: GeoJsonProperties) {
    const tooltipProperties = [];
    for (const key in properties) {
      if (key.startsWith('__kbn')) {
        // these are system properties and should be ignored
        continue;
      }
      tooltipProperties.push(new TooltipProperty(key, key, properties[key]));
    }
    return tooltipProperties;
  }

  async isTimeAware() {
    return false;
  }

  showJoinEditor() {
    return true;
  }

  async getSupportedShapeTypes() {
    return [VECTOR_SHAPE_TYPE.POINT, VECTOR_SHAPE_TYPE.LINE, VECTOR_SHAPE_TYPE.POLYGON];
  }

  getSourceTooltipContent(/* sourceDataRequest */) {
    return { tooltipContent: null, areResultsTrimmed: false };
  }

  getSyncMeta() {
    return {};
  }
}
