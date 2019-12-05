/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { AbstractLayer } from './layer';
import { VectorStyle } from './styles/vector/vector_style';
import {
  SOURCE_DATA_ID_ORIGIN,
  LAYER_TYPE
} from '../../common/constants';
import _ from 'lodash';
import { JoinTooltipProperty } from './tooltips/join_tooltip_property';
import { DataRequestAbortError } from './util/data_request';
import { canSkipSourceUpdate } from './util/can_skip_fetch';
import { assignFeatureIds } from './util/assign_feature_ids';
import {
  getFillFilterExpression,
  getLineFilterExpression,
  getPointFilterExpression,
} from './util/mb_filter_expressions';
import { VectorLayer } from './vector_layer';

export class TiledVectorLayer extends AbstractLayer {

  static type = LAYER_TYPE.VECTOR_TILE;

  static createDescriptor(options, mapColors) {
    const layerDescriptor = super.createDescriptor(options);
    layerDescriptor.type = TiledVectorLayer.type;
    return layerDescriptor;
  }

  constructor(options) {
    super(options);
    // this._style = new VectorStyle(this._descriptor.style, this._source, this);
  }

  destroy() {
    if (this._source) {
      this._source.destroy();
    }
    this._joins.forEach(joinSource => {
      joinSource.destroy();
    });
  }

  getLayerTypeIconName() {
    return 'vector';
  }

  createDefaultLayer(options, mapColors) {
    const layerDescriptor = this._createDefaultLayerDescriptor(options, mapColors);
    const style = new VectorStyle(layerDescriptor.style, this);
    return new VectorLayer({
      layerDescriptor: layerDescriptor,
      source: this,
      style
    });
  }

  async getSourceName() {
    return this._source.getDisplayName();
  }

  async getDateFields() {
    return await this._source.getDateFields();
  }

  async _syncSource({
    startLoading, stopLoading, onLoadError, registerCancelCallback, dataFilters
  }) {

    const requestToken = Symbol(`layer-source-refresh:${this.getId()} - source`);
    // const searchFilters = this._getSearchFilters(dataFilters);
    const prevDataRequest = this.getSourceDataRequest();

    if (prevDataRequest) {
      console.log('already has a data request');
      return;
    }

    // const canSkipFetch = await canSkipSourceUpdate({
    //   source: this._source,
    //   prevDataRequest,
    //   nextMeta: searchFilters,
    // });
    // if (canSkipFetch) {
    //   return {
    //     refreshed: false,
    //     featureCollection: prevDataRequest.getData()
    //   };
    // }



    try {
      // startLoading(SOURCE_DATA_ID_ORIGIN, requestToken, searchFilters);
      // const layerName = await this.getDisplayName();
      // await this._source.getGeoJsonWithMeta(layerName, searchFilters,
      //   registerCancelCallback.bind(null, requestToken)
      // );


      // stopLoading(SOURCE_DATA_ID_ORIGIN, requestToken, layerFeatureCollection, meta);
    } catch (error) {
      if (!(error instanceof DataRequestAbortError)) {
        onLoadError(SOURCE_DATA_ID_ORIGIN, requestToken, error.message);
      }
      return {
        refreshed: false
      };
    }
  }

  async syncData(syncContext) {
    if (!this.isVisible() || !this.showAtZoomLevel(syncContext.dataFilters.zoom)) {
      return;
    }

    await this._syncSource(syncContext);

  }

  // _setMbPointsProperties(mbMap) {
  //   const pointLayerId = this._getMbPointLayerId();
  //   const symbolLayerId = this._getMbSymbolLayerId();
  //   const pointLayer = mbMap.getLayer(pointLayerId);
  //   const symbolLayer = mbMap.getLayer(symbolLayerId);
  //
  //   let mbLayerId;
  //   if (this._style.arePointsSymbolizedAsCircles()) {
  //     mbLayerId = pointLayerId;
  //     if (symbolLayer) {
  //       mbMap.setLayoutProperty(symbolLayerId, 'visibility', 'none');
  //     }
  //     this._setMbCircleProperties(mbMap);
  //   } else {
  //     mbLayerId = symbolLayerId;
  //     if (pointLayer) {
  //       mbMap.setLayoutProperty(pointLayerId, 'visibility', 'none');
  //     }
  //     this._setMbSymbolProperties(mbMap);
  //   }
  //
  //   this.syncVisibilityWithMb(mbMap, mbLayerId);
  //   mbMap.setLayerZoomRange(mbLayerId, this._descriptor.minZoom, this._descriptor.maxZoom);
  // }

  // _setMbCircleProperties(mbMap) {
  //   const sourceId = this.getId();
  //   const pointLayerId = this._getMbPointLayerId();
  //   const pointLayer = mbMap.getLayer(pointLayerId);
  //
  //   if (!pointLayer) {
  //     mbMap.addLayer({
  //       id: pointLayerId,
  //       type: 'circle',
  //       source: sourceId,
  //       paint: {}
  //     });
  //   }
  //
  //   const filterExpr = getPointFilterExpression(this._hasJoins());
  //   if (filterExpr !== mbMap.getFilter(pointLayerId)) {
  //     mbMap.setFilter(pointLayerId, filterExpr);
  //   }
  //
  //   this._style.setMBPaintPropertiesForPoints({
  //     alpha: this.getAlpha(),
  //     mbMap,
  //     pointLayerId: pointLayerId,
  //   });
  // }
  //
  // _setMbSymbolProperties(mbMap) {
  //   const sourceId = this.getId();
  //   const symbolLayerId = this._getMbSymbolLayerId();
  //   const symbolLayer = mbMap.getLayer(symbolLayerId);
  //
  //   if (!symbolLayer) {
  //     mbMap.addLayer({
  //       id: symbolLayerId,
  //       type: 'symbol',
  //       source: sourceId,
  //     });
  //   }
  //
  //   const filterExpr = getPointFilterExpression(this._hasJoins());
  //   if (filterExpr !== mbMap.getFilter(symbolLayerId)) {
  //     mbMap.setFilter(symbolLayerId, filterExpr);
  //   }
  //
  //   this._style.setMBSymbolPropertiesForPoints({
  //     alpha: this.getAlpha(),
  //     mbMap,
  //     symbolLayerId: symbolLayerId,
  //   });
  // }
  //
  // _setMbLinePolygonProperties(mbMap) {
  //   const sourceId = this.getId();
  //   const fillLayerId = this._getMbPolygonLayerId();
  //   const lineLayerId = this._getMbLineLayerId();
  //   const hasJoins = this._hasJoins();
  //   if (!mbMap.getLayer(fillLayerId)) {
  //     mbMap.addLayer({
  //       id: fillLayerId,
  //       type: 'fill',
  //       source: sourceId,
  //       paint: {}
  //     });
  //   }
  //   if (!mbMap.getLayer(lineLayerId)) {
  //     mbMap.addLayer({
  //       id: lineLayerId,
  //       type: 'line',
  //       source: sourceId,
  //       paint: {}
  //     });
  //   }
  //   this._style.setMBPaintProperties({
  //     alpha: this.getAlpha(),
  //     mbMap,
  //     fillLayerId,
  //     lineLayerId,
  //   });
  //
  //   this.syncVisibilityWithMb(mbMap, fillLayerId);
  //   mbMap.setLayerZoomRange(fillLayerId, this._descriptor.minZoom, this._descriptor.maxZoom);
  //   const fillFilterExpr = getFillFilterExpression(hasJoins);
  //   if (fillFilterExpr !== mbMap.getFilter(fillLayerId)) {
  //     mbMap.setFilter(fillLayerId, fillFilterExpr);
  //   }
  //
  //   this.syncVisibilityWithMb(mbMap, lineLayerId);
  //   mbMap.setLayerZoomRange(lineLayerId, this._descriptor.minZoom, this._descriptor.maxZoom);
  //   const lineFilterExpr = getLineFilterExpression(hasJoins);
  //   if (lineFilterExpr !== mbMap.getFilter(lineLayerId)) {
  //     mbMap.setFilter(lineLayerId, lineFilterExpr);
  //   }
  // }

  _syncStylePropertiesWithMb(mbMap) {
    console.log('need to sync style', mbMap);
    // this._setMbPointsProperties(mbMap);
    // this._setMbLinePolygonProperties(mbMap);
  }

  _syncSourceBindingWithMb(mbMap) {
    const mbSource = mbMap.getSource(this.getId());
    if (!mbSource) {
      console.log('need to sync source');
      // mbMap.addSource(this.getId(), {
      //   type: 'geojson',
      //   data: EMPTY_FEATURE_COLLECTION
      // });
    }
  }

  syncLayerWithMB(mbMap) {
    this._syncSourceBindingWithMb(mbMap);
    this._syncStylePropertiesWithMb(mbMap);
  }

  _getMbPointLayerId() {
    return this.makeMbLayerId('circle');
  }

  _getMbSymbolLayerId() {
    return this.makeMbLayerId('symbol');
  }

  _getMbLineLayerId() {
    return this.makeMbLayerId('line');
  }

  _getMbPolygonLayerId() {
    return this.makeMbLayerId('fill');
  }

  getMbLayerIds() {
    // return [this._getMbPointLayerId(), this._getMbSymbolLayerId(), this._getMbLineLayerId(), this._getMbPolygonLayerId()];
    return [this._getMbLineLayerId()];
  }

  ownsMbLayerId(mbLayerId) {
    return this._getMbPointLayerId() === mbLayerId ||
      this._getMbLineLayerId() === mbLayerId ||
      this._getMbPolygonLayerId() === mbLayerId ||
      this._getMbSymbolLayerId() === mbLayerId;
  }

  ownsMbSourceId(mbSourceId) {
    return this.getId() === mbSourceId;
  }

}
