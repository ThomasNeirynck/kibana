/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
/* eslint-disable @typescript-eslint/consistent-type-definitions */

import _ from 'lodash';
import React, { ReactElement } from 'react';
import { EuiIcon, EuiLoadingSpinner } from '@elastic/eui';
import uuid from 'uuid/v4';
import { i18n } from '@kbn/i18n';
import { FeatureCollection } from 'geojson';
import { DataRequest } from './util/data_request';
import {
  LAYER_TYPE,
  MAX_ZOOM,
  MB_SOURCE_ID_LAYER_ID_PREFIX_DELIMITER,
  MIN_ZOOM,
  SOURCE_DATA_ID_ORIGIN,
} from '../../common/constants';
// @ts-ignore
// eslint-disable-next-line @kbn/eslint/no-restricted-paths
import { copyPersistentState } from '../reducers/util.js';
import {
  LayerDescriptor,
  MapExtent,
  MapFilters,
  Query,
  StyleDescriptor,
} from '../../common/descriptor_types';
import { Attribution, ImmutableSourceProperty, ISource } from './sources/source';
import { SyncContext } from '../actions/map_actions';
import { IStyle } from './styles/abstract_style';

export interface ILayer {
  getBounds(mapFilters: MapFilters): Promise<MapExtent>;
  getDataRequest(id: string): DataRequest | undefined;
  getDisplayName(source?: ISource): Promise<string>;
  getId(): string;
  getSourceDataRequest(): DataRequest | undefined;
  getSource(): ISource;
  getSourceForEditing(): ISource;
  syncData(syncContext: SyncContext): Promise<void>;
  supportsElasticsearchFilters(): boolean;
  supportsFitToBounds(): Promise<boolean>;
  getAttributions(): Promise<Attribution[]>;
  getLabel(): string;
  getCustomIconAndTooltipContent(): IconAndTooltipContent;
  getIconAndTooltipContent(zoomLevel: number, isUsingSearch: boolean): IconAndTooltipContent;
  renderLegendDetails(): ReactElement<any> | null;
  showAtZoomLevel(zoom: number): boolean;
  getMinZoom(): number;
  getMaxZoom(): number;
  getAlpha(): number;
  getQuery(): Query;
  getStyle(): IStyle;
  getStyleForEditing(): IStyle;
  getCurrentStyle(): IStyle;
  getImmutableSourceProperties(): Promise<ImmutableSourceProperty[]>;
  renderSourceSettingsEditor({ onChange }: { onChange: () => void }): ReactElement<any> | null;
  isLayerLoading(): boolean;
  hasErrors(): boolean;
  getErrors(): string;
  toLayerDescriptor(): LayerDescriptor;
  getMbLayerIds(): string[];
  ownsMbLayerId(mbLayerId: string): boolean;
  ownsMbSourceId(mbSourceId: string): boolean;
  canShowTooltip(): boolean;
  syncLayerWithMB(mbMap: unknown): void;
  getLayerTypeIconName(): string;
  isDataLoaded(): boolean;
  getIndexPatternIds(): string[];
  getQueryableIndexPatternIds(): string[];
  getType(): LAYER_TYPE | undefined;
  isVisible(): boolean;
  cloneDescriptor(): LayerDescriptor;
  renderStyleEditor({
    onStyleDescriptorChange,
  }: {
    onStyleDescriptorChange: (styleDescriptor: StyleDescriptor) => void;
  }): ReactElement<any> | null;
}
export type Footnote = {
  icon: ReactElement<any>;
  message: string | undefined;
};
export type IconAndTooltipContent = {
  icon: ReactElement<any>;
  tooltipContent?: string | null;
  footnotes?: Footnote[];
  areResultsTrimmed?: boolean;
};

export interface ILayerArguments {
  layerDescriptor: LayerDescriptor;
  source: ISource;
}

export class AbstractLayer implements ILayer {
  protected readonly _descriptor: LayerDescriptor;
  protected readonly _source: ISource;
  protected readonly _style: IStyle;
  protected readonly _dataRequests: DataRequest[];

  static createDescriptor(options: Partial<LayerDescriptor>): LayerDescriptor {
    const layerDescriptor: LayerDescriptor = { ...options };

    layerDescriptor.__dataRequests = _.get(options, '__dataRequests', []);
    layerDescriptor.id = _.get(options, 'id', uuid());
    layerDescriptor.label = options.label && options.label.length > 0 ? options.label : null;
    layerDescriptor.minZoom = _.get(options, 'minZoom', MIN_ZOOM);
    layerDescriptor.maxZoom = _.get(options, 'maxZoom', MAX_ZOOM);
    layerDescriptor.alpha = _.get(options, 'alpha', 0.75);
    layerDescriptor.visible = _.get(options, 'visible', true);
    layerDescriptor.style = _.get(options, 'style', {});

    return layerDescriptor;
  }

  destroy() {
    if (this._source) {
      this._source.destroy();
    }
  }

  constructor({ layerDescriptor, source }: ILayerArguments) {
    this._descriptor = AbstractLayer.createDescriptor(layerDescriptor);
    this._source = source;
    if (this._descriptor.__dataRequests) {
      this._dataRequests = this._descriptor.__dataRequests.map(
        dataRequest => new DataRequest(dataRequest)
      );
    } else {
      this._dataRequests = [];
    }
  }

  static getBoundDataForSource(mbMap: unkown, sourceId: string): FeatureCollection {
    // @ts-ignore
    const mbStyle = mbMap.getStyle();
    return mbStyle.sources[sourceId].data;
  }

  async cloneDescriptor(): Promise<LayerDescriptor> {
    // @ts-ignore
    const clonedDescriptor = copyPersistentState(this._descriptor);
    // layer id is uuid used to track styles/layers in mapbox
    clonedDescriptor.id = uuid();
    const displayName = await this.getDisplayName();
    clonedDescriptor.label = `Clone of ${displayName}`;
    clonedDescriptor.sourceDescriptor = this.getSource().cloneDescriptor();
    if (clonedDescriptor.joins) {
      clonedDescriptor.joins.forEach(joinDescriptor => {
        // right.id is uuid used to track requests in inspector
        joinDescriptor.right.id = uuid();
      });
    }
    return clonedDescriptor;
  }

  makeMbLayerId(layerNameSuffix: string): string {
    return `${this.getId()}${MB_SOURCE_ID_LAYER_ID_PREFIX_DELIMITER}${layerNameSuffix}`;
  }

  isJoinable(): boolean {
    return this.getSource().isJoinable();
  }

  supportsElasticsearchFilters(): boolean {
    return this.getSource().isESSource();
  }

  async supportsFitToBounds(): Promise<boolean> {
    return await this.getSource().supportsFitToBounds();
  }

  async getDisplayName(source?: ISource): Promise<string> {
    if (this._descriptor.label) {
      return this._descriptor.label;
    }

    const sourceDisplayName = source
      ? await source.getDisplayName()
      : await this.getSource().getDisplayName();
    return sourceDisplayName || `Layer ${this._descriptor.id}`;
  }

  async getAttributions(): Promise<Attribution[]> {
    if (!this.hasErrors()) {
      return await this.getSource().getAttributions();
    }
    return [];
  }

  getStyleForEditing(): IStyle {
    return this._style;
  }

  getStyle() {
    return this._style;
  }

  getLabel(): string {
    return this._descriptor.label ? this._descriptor.label : '';
  }

  getCustomIconAndTooltipContent(): IconAndTooltipContent {
    return {
      icon: <EuiIcon size="m" type={this.getLayerTypeIconName()} />,
    };
  }

  getIconAndTooltipContent(zoomLevel: number, isUsingSearch: boolean): IconAndTooltipContent {
    let icon;
    let tooltipContent = null;
    const footnotes = [];
    if (this.hasErrors()) {
      icon = (
        <EuiIcon
          aria-label={i18n.translate('xpack.maps.layer.loadWarningAriaLabel', {
            defaultMessage: 'Load warning',
          })}
          size="m"
          type="alert"
          color="warning"
        />
      );
      tooltipContent = this.getErrors();
    } else if (this.isLayerLoading()) {
      icon = <EuiLoadingSpinner size="m" />;
    } else if (!this.isVisible()) {
      icon = <EuiIcon size="m" type="eyeClosed" />;
      tooltipContent = i18n.translate('xpack.maps.layer.layerHiddenTooltip', {
        defaultMessage: `Layer is hidden.`,
      });
    } else if (!this.showAtZoomLevel(zoomLevel)) {
      const minZoom = this.getMinZoom();
      const maxZoom = this.getMaxZoom();
      icon = <EuiIcon size="m" type="expand" />;
      tooltipContent = i18n.translate('xpack.maps.layer.zoomFeedbackTooltip', {
        defaultMessage: `Layer is visible between zoom levels {minZoom} and {maxZoom}.`,
        values: { minZoom, maxZoom },
      });
    } else {
      const customIconAndTooltipContent = this.getCustomIconAndTooltipContent();
      if (customIconAndTooltipContent) {
        icon = customIconAndTooltipContent.icon;
        if (!customIconAndTooltipContent.areResultsTrimmed) {
          tooltipContent = customIconAndTooltipContent.tooltipContent;
        } else {
          footnotes.push({
            icon: <EuiIcon color="subdued" type="partial" size="s" />,
            message: customIconAndTooltipContent.tooltipContent,
          });
        }
      }

      if (isUsingSearch && this.getQueryableIndexPatternIds().length) {
        footnotes.push({
          icon: <EuiIcon color="subdued" type="filter" size="s" />,
          message: i18n.translate('xpack.maps.layer.isUsingSearchMsg', {
            defaultMessage: 'Results narrowed by search bar',
          }),
        });
      }
    }

    return {
      icon,
      tooltipContent,
      footnotes,
    };
  }

  async hasLegendDetails(): Promise<boolean> {
    return false;
  }

  renderLegendDetails(): ReactElement<any> | null {
    return null;
  }

  getId(): string {
    return this._descriptor.id;
  }

  getSource(): ISource {
    return this._source;
  }

  getSourceForEditing(): ISource {
    return this._source;
  }

  isVisible(): boolean {
    return !!this._descriptor.visible;
  }

  showAtZoomLevel(zoom: number): boolean {
    return zoom >= this._descriptor.minZoom && zoom <= this._descriptor.maxZoom;
  }

  getMinZoom(): number {
    return typeof this._descriptor.minZoom === 'number' ? this._descriptor.minZoom : MIN_ZOOM;
  }

  getMaxZoom(): number {
    return typeof this._descriptor.maxZoom === 'number' ? this._descriptor.maxZoom : MAX_ZOOM;
  }

  getAlpha(): number {
    return typeof this._descriptor.alpha === 'number' ? this._descriptor.alpha : 1;
  }

  getQuery(): Query {
    return this._descriptor.query;
  }

  getCurrentStyle(): IStyle {
    return this._style;
  }

  async getImmutableSourceProperties() {
    const source = this.getSource();
    return await source.getImmutableProperties();
  }

  renderSourceSettingsEditor({ onChange }: { onChange: () => void }) {
    const source = this.getSourceForEditing();
    return source.renderSourceSettingsEditor({ onChange });
  }

  getPrevRequestToken(dataId): symbol | undefined {
    const prevDataRequest = this.getDataRequest(dataId);
    if (!prevDataRequest) {
      return;
    }

    return prevDataRequest.getRequestToken();
  }

  getInFlightRequestTokens(): symbol[] {
    if (!this._dataRequests) {
      return [];
    }

    const requestTokens = this._dataRequests.map(dataRequest => dataRequest.getRequestToken());
    return _.compact(requestTokens);
  }

  getSourceDataRequest(): DataRequest | undefined {
    return this.getDataRequest(SOURCE_DATA_ID_ORIGIN);
  }

  getDataRequest(id): DataRequest | undefined {
    return this._dataRequests.find(dataRequest => dataRequest.getDataId() === id);
  }

  isLayerLoading(): boolean {
    return this._dataRequests.some(dataRequest => dataRequest.isLoading());
  }

  hasErrors(): boolean {
    return _.get(this._descriptor, '__isInErrorState', false);
  }

  getErrors(): string {
    return this.hasErrors() ? this._descriptor.__errorMessage : '';
  }

  toLayerDescriptor(): LayerDescriptor {
    return this._descriptor;
  }

  syncData(syncContext: SyncContext): Promise<void> {
    // no-op by default
  }

  getMbLayerIds(): string[] {
    throw new Error('Should implement AbstractLayer#getMbLayerIds');
  }

  ownsMbLayerId(): boolean {
    throw new Error('Should implement AbstractLayer#ownsMbLayerId');
  }

  ownsMbSourceId(): boolean {
    throw new Error('Should implement AbstractLayer#ownsMbSourceId');
  }

  canShowTooltip() {
    return false;
  }

  syncLayerWithMB() {
    throw new Error('Should implement AbstractLayer#syncLayerWithMB');
  }

  getLayerTypeIconName(): string {
    throw new Error('should implement Layer#getLayerTypeIconName');
  }

  isDataLoaded(): boolean {
    const sourceDataRequest = this.getSourceDataRequest();
    return sourceDataRequest ? sourceDataRequest.hasData() : false;
  }

  async getBounds(mapFilters: MapFilters): Promise<MapExtent> {
    return {
      minLon: -180,
      maxLon: 180,
      minLat: -89,
      maxLat: 89,
    };
  }

  renderStyleEditor({
    onStyleDescriptorChange,
  }: {
    onStyleDescriptorChange: (styleDescriptor: StyleDescriptor) => void;
  }): ReactElement<any> | null {
    const style = this.getStyleForEditing();
    if (!style) {
      return null;
    }
    return style.renderEditor({ layer: this, onStyleDescriptorChange });
  }

  getIndexPatternIds(): string[] {
    return [];
  }

  getQueryableIndexPatternIds(): string[] {
    return [];
  }

  syncVisibilityWithMb(mbMap: unknown, mbLayerId: string) {
    // @ts-ignore
    mbMap.setLayoutProperty(mbLayerId, 'visibility', this.isVisible() ? 'visible' : 'none');
  }

  getType(): LAYER_TYPE | undefined {
    return this._descriptor.type;
  }
}
