/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { AbstractESAggSource } from '../es_agg_source';
import {
  ESGeoGridSourceDescriptor,
  MapFilters,
  MapQuery,
  VectorSourceSyncMeta,
} from '../../../../common/descriptor_types';
import { GRID_RESOLUTION } from '../../../../common/constants';
import { ITiledSingleLayerVectorSource } from '../vector_source';

export class ESGeoGridSource extends AbstractESAggSource implements ITiledSingleLayerVectorSource {
  static createDescriptor({
    indexPatternId,
    geoField,
    requestType,
    resolution,
  }: Partial<ESGeoGridSourceDescriptor>): ESGeoGridSourceDescriptor;

  constructor(sourceDescriptor: ESGeoGridSourceDescriptor, inspectorAdapters: unknown);

  private readonly _descriptor: ESGeoGridSourceDescriptor;

  getFieldNames(): string[];
  getGridResolution(): GRID_RESOLUTION;
  getGeoGridPrecision(zoom: number): number;

  getLayerName(): string;

  getUrlTemplateWithMeta(
    searchFilters: MapFilters & {
      applyGlobalQuery: boolean;
      fieldNames: string[];
      geogridPrecision?: number;
      sourceQuery: MapQuery;
      sourceMeta: VectorSourceSyncMeta;
    }
  ): Promise<{
    layerName: string;
    urlTemplate: string;
    minSourceZoom: number;
    maxSourceZoom: number;
  }>;
}
