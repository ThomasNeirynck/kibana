/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { i18n } from '@kbn/i18n';
import uuid from 'uuid/v4';
import React from 'react';
import { MVTVectorSourceEditor } from './mvt_vector_source_editor';
import { AbstractSource } from '../source';
import { SingleTiledVectorLayer } from '../../tiled_vector_layer';
import { GeoJsonWithMeta, ITiledSingleLayerVectorSource } from '../vector_source';
import { MAX_ZOOM, MIN_ZOOM, MVT_SINGLE_LAYER } from '../../../../common/constants';
import { VECTOR_SHAPE_TYPES } from '../vector_feature_types';
import { IField } from '../../fields/field';
import { registerSource } from '../source_registry';
import { getDataSourceLabel, getUrlLabel } from '../../../../common/i18n_getters';
import {
  LayerDescriptor,
  MapExtent,
  TiledSingleLayerVectorSourceDescriptor,
  VectorSourceRequestMeta,
  VectorSourceSyncMeta,
} from '../../../../common/descriptor_types';
import { VectorLayerArguments } from '../../vector_layer';

const sourceTitle = i18n.translate('xpack.maps.source.ems_xyzVectorTitle', {
  defaultMessage: 'Vector Tile Layer',
});

export class MVTSingleLayerVectorSource extends AbstractSource
  implements ITiledSingleLayerVectorSource {
  static type = MVT_SINGLE_LAYER;
  static title = i18n.translate('xpack.maps.source.tiledSingleLayerVectorTitle', {
    defaultMessage: 'Tiled vector',
  });
  static description = i18n.translate('xpack.maps.source.tiledSingleLayerVectorDescription', {
    defaultMessage: 'Tiled vector with url template',
  });

  static icon = 'logoElasticsearch';

  static createDescriptor({
    urlTemplate,
    layerName,
    minZoom,
    maxZoom,
  }: TiledSingleLayerVectorSourceDescriptor) {
    return {
      type: MVTSingleLayerVectorSource.type,
      id: uuid(),
      urlTemplate,
      layerName,
      minZoom: Math.max(MIN_ZOOM, minZoom),
      maxZoom: Math.min(MAX_ZOOM, maxZoom),
    };
  }

  readonly _descriptor: TiledSingleLayerVectorSourceDescriptor;

  constructor(
    sourceDescriptor: TiledSingleLayerVectorSourceDescriptor,
    inspectorAdapters?: object
  ) {
    super(sourceDescriptor, inspectorAdapters);
    this._descriptor = sourceDescriptor;
  }

  renderSourceSettingsEditor() {
    return null;
  }

  createDefaultLayer(options: LayerDescriptor): SingleTiledVectorLayer {
    const layerDescriptor = {
      sourceDescriptor: this._descriptor,
      ...options,
    };
    const normalizedLayerDescriptor: LayerDescriptor = SingleTiledVectorLayer.createDescriptor(
      { layerDescriptor, source: this },
      []
    );
    const vectorLayerArguments: VectorLayerArguments = {
      layerDescriptor: normalizedLayerDescriptor,
      source: this,
      ...options,
    };
    return new SingleTiledVectorLayer(vectorLayerArguments);
  }

  getGeoJsonWithMeta(
    layerName: 'string',
    searchFilters: unknown[],
    registerCancelCallback: (callback: () => void) => void
  ): Promise<GeoJsonWithMeta> {
    throw new Error('Does not implement getGeoJsonWithMeta');
  }

  async getFields(): Promise<IField[]> {
    return [];
  }

  async getImmutableProperties() {
    return [
      { label: getDataSourceLabel(), value: sourceTitle },
      { label: getUrlLabel(), value: this._descriptor.urlTemplate },
      { label: 'Layer name', value: this._descriptor.layerName },
      { label: 'Min zoom', value: this._descriptor.minZoom },
      { label: 'Max zoom', value: this._descriptor.maxZoom },
    ];
  }

  async getDisplayName(): Promise<string> {
    return this._descriptor.layerName;
  }

  async getUrlTemplateWithMeta() {
    return {
      urlTemplate: this._descriptor.urlTemplate,
      layerName: this._descriptor.layerName,
      minZoom: this._descriptor.minZoom,
      maxZoom: this._descriptor.maxZoom,
    };
  }

  async getSupportedShapeTypes() {
    return [VECTOR_SHAPE_TYPES.POINT, VECTOR_SHAPE_TYPES.LINE, VECTOR_SHAPE_TYPES.POLYGON];
  }

  canFormatFeatureProperties() {
    return false;
  }

  getMinZoom() {
    return this._descriptor.minZoom;
  }

  getMaxZoom() {
    return this._descriptor.maxZoom;
  }

  getBoundsForFilters(searchFilters: VectorSourceRequestMeta): MapExtent {
    return {
      maxLat: 90,
      maxLon: 180,
      minLat: -90,
      minLon: -180,
    };
  }

  getFieldByName(fieldName: string): IField | null {
    return null;
  }

  getSyncMeta(): VectorSourceSyncMeta {
    return null;
  }

  getApplyGlobalQuery(): boolean {
    return false;
  }
}

registerSource({
  ConstructorFunction: MVTSingleLayerVectorSource,
  type: MVT_SINGLE_LAYER,
});

export const mvtVectorSourceWizardConfig = {
  description: i18n.translate('xpack.maps.source.mvtVectorSourceWizard', {
    defaultMessage: 'Vector source wizard',
  }),
  icon: 'grid',
  renderWizard: ({
    onPreviewSource,
    inspectorAdapters,
  }: {
    onPreviewSource: (source: MVTSingleLayerVectorSource) => void;
    inspectorAdapters: object;
  }) => {
    const onSourceConfigChange = ({
      urlTemplate,
      layerName,
      minZoom,
      maxZoom,
    }: {
      urlTemplate: string;
      layerName: string;
      minZoom: number;
      maxZoom: number;
    }) => {
      const sourceDescriptor = MVTSingleLayerVectorSource.createDescriptor({
        urlTemplate,
        layerName,
        minZoom,
        maxZoom,
        type: MVTSingleLayerVectorSource.type,
      });
      const source = new MVTSingleLayerVectorSource(sourceDescriptor, inspectorAdapters);
      onPreviewSource(source);
    };
    return <MVTVectorSourceEditor onSourceConfigChange={onSourceConfigChange} />;
  },
  title: sourceTitle,
};
