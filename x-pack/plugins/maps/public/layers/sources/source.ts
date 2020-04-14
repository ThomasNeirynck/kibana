/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

/* eslint-disable @typescript-eslint/consistent-type-definitions */

// eslint-disable-next-line @kbn/eslint/no-restricted-paths
import { ReactElement } from 'react';
import { copyPersistentState } from '../../reducers/util';

import { LayerDescriptor, SourceDescriptor } from '../../../common/descriptor_types';
import { ILayer } from '../layer';
import { IField } from '../fields/field';

export type ImmutableSourceProperty = {
  label: string;
  value: string;
};

export type Attribution = {
  url: string;
  label: string;
};

export type PreIndexedShape = {
  index: string;
  id: string | number;
  path: string;
};

export type FieldFormatter = (value: string | number | null | undefined | boolean) => string;

// layerName,
//   style,
//   dynamicStyleProps,
//   registerCancelCallback,
//   searchFilters

export interface ISource {
  createDefaultLayer(options?: LayerDescriptor): ILayer;
  destroy(): void;
  getDisplayName(): Promise<string>;
  getInspectorAdapters(): object | undefined;
  isFieldAware(): boolean;
  isFilterByMapBounds(): boolean;
  isGeoGridPrecisionAware(): boolean;
  isQueryAware(): boolean;
  isRefreshTimerAware(): Promise<boolean>;
  isTimeAware(): Promise<boolean>;
  getImmutableProperties(): Promise<ImmutableSourceProperty[]>;
  getAttributions(): Promise<Attribution[]>;
  isESSource(): boolean;
  renderSourceSettingsEditor({ onChange }: { onChange: () => void }): ReactElement<any> | null;
  supportsFitToBounds(): Promise<boolean>;
  isJoinable(): boolean;
  cloneDescriptor(): SourceDescriptor;
  getFieldNames(): string[];
  getApplyGlobalQuery(): boolean;
  getIndexPatternIds(): string[];
  getQueryableIndexPatternIds(): string[];
  getGeoGridPrecision(): number;
  shouldBeIndexed(): number;
  getPreIndexedShape(): PreIndexedShape | null;
  createFieldFormatter(field: IField): FieldFormatter | null;
  loadStylePropsMeta(args: unknown): unknown; // todo
  getValueSuggestions(field: IField, query: string): string[];
}

export class AbstractSource implements ISource {
  static isIndexingSource = false;

  static createDescriptor(): SourceDescriptor {
    throw new Error('Must implement Source.createDescriptor');
  }

  readonly _descriptor: SourceDescriptor;
  readonly _inspectorAdapters?: object;

  constructor(descriptor: SourceDescriptor, inspectorAdapters?: object) {
    this._descriptor = descriptor;
    this._inspectorAdapters = inspectorAdapters;
  }

  destroy(): void {}

  cloneDescriptor(): SourceDescriptor {
    return copyPersistentState(this._descriptor);
  }

  async supportsFitToBounds(): boolean {
    return true;
  }

  /**
   * return list of immutable source properties.
   * Immutable source properties are properties that can not be edited by the user.
   */
  async getImmutableProperties(): Promise<ImmutableSourceProperty[]> {
    return [];
  }

  getInspectorAdapters(): object | undefined {
    return this._inspectorAdapters;
  }

  createDefaultLayer() {
    throw new Error(`Source#createDefaultLayer not implemented`);
  }

  async getDisplayName(): Promise<string> {
    return '';
  }

  /**
   * return attribution for this layer as array of objects with url and label property.
   * e.g. [{ url: 'example.com', label: 'foobar' }]
   * @return {Promise<null>}
   */
  async getAttributions(): Promise<Attribution> {
    return [];
  }

  isFieldAware(): boolean {
    return false;
  }

  isRefreshTimerAware(): boolean {
    return false;
  }

  isGeoGridPrecisionAware(): boolean {
    return false;
  }

  isQueryAware(): boolean {
    return false;
  }

  getFieldNames(): string[] {
    return [];
  }

  renderSourceSettingsEditor() {
    return null;
  }

  getApplyGlobalQuery(): boolean {
    return !!this._descriptor.applyGlobalQuery;
  }

  getIndexPatternIds(): string[] {
    return [];
  }

  getQueryableIndexPatternIds(): string[] {
    return [];
  }

  getGeoGridPrecision(): number {
    return 0;
  }

  isJoinable(): boolean {
    return false;
  }

  shouldBeIndexed(): boolean {
    return AbstractSource.isIndexingSource;
  }

  isESSource(): boolean {
    return false;
  }

  // Returns geo_shape indexed_shape context for spatial quering by pre-indexed shapes
  async getPreIndexedShape(/* properties */): PreIndexedShape | null {
    return null;
  }

  // Returns function used to format value
  async createFieldFormatter(field: IField): FieldFormatter | null {
    return null;
  }

  async loadStylePropsMeta(args: unknown): unknown {
    throw new Error(`Source#loadStylePropsMeta not implemented`);
  }

  async getValueSuggestions(field: IField, query: string): string[] {
    return [];
  }
}
