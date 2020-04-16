/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { ReactElement } from 'react';
import { StyleDescriptor, StyleMetaDescriptor } from '../../../common/descriptor_types';
import { ILayer } from '../layer';
import { IField } from '../fields/field';
import { DataRequest } from '../util/data_request';

// todo: not sure if this is the right one
export interface IStyle {
  getDescriptor(): StyleDescriptor;
  getDescriptorWithMissingStylePropsRemoved(
    nextFields: IField[]
  ): { hasChanges: boolean; nextStyleDescriptor?: StyleDescriptor };
  pluckStyleMetaFromSourceDataRequest(sourceDataRequest: DataRequest): StyleMetaDescriptor;
  renderEditor({
    layer,
    onStyleDescriptorChange,
  }: {
    layer: ILayer;
    onStyleDescriptorChange: (styleDescriptor: StyleDescriptor) => void;
  }): ReactElement<any> | null;
  getSourceFieldNames(): string[];
}

export class AbstractStyle implements IStyle {
  readonly _descriptor: StyleDescriptor;

  constructor(descriptor: StyleDescriptor) {
    this._descriptor = descriptor;
  }

  getDescriptorWithMissingStylePropsRemoved(
    nextFields: IField[]
  ): { hasChanges: boolean; nextStyleDescriptor?: StyleDescriptor } {
    return {
      hasChanges: false,
    };
  }

  pluckStyleMetaFromSourceDataRequest(sourceDataRequest: DataRequest): StyleMetaDescriptor {
    return { fieldMeta: {} };
  }

  getDescriptor(): StyleDescriptor {
    return this._descriptor;
  }

  renderEditor(/* { layer, onStyleDescriptorChange } */) {
    return null;
  }

  getSourceFieldNames(): string[] {
    return [];
  }
}
