/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
/* eslint-disable @typescript-eslint/consistent-type-definitions */

import React, { Fragment, Component, ChangeEvent } from 'react';
import _ from 'lodash';
import { EuiFieldText, EuiFormRow } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { MAX_ZOOM, MIN_ZOOM } from '../../../../common/constants';
import { ValidatedDualRange, Value } from '../../../../../../../src/plugins/kibana_react/public';
import { MVTFieldConfigEditor } from './mvt_field_config_editor';
import {
  MVTFieldDescriptor,
  TiledSingleLayerVectorSourceDescriptor,
} from '../../../../common/descriptor_types';
import { MVTSingleLayerSourceSettings } from './mvt_single_layer_source_settings';

export interface Props {
  onSourceConfigChange: (sourceConfig: TiledSingleLayerVectorSourceDescriptor) => void;
}

interface State {
  urlTemplate: string;
  layerName: string;
  minSourceZoom: number;
  maxSourceZoom: number;
  fields?: MVTFieldDescriptor[];
}

export class MVTSingleLayerVectorSourceEditor extends Component<Props, State> {
  state = {
    urlTemplate: '',
    layerName: '',
    minSourceZoom: MIN_ZOOM,
    maxSourceZoom: MAX_ZOOM,
    fields: [],
  };

  _sourceConfigChange = _.debounce(() => {
    const canPreview =
      this.state.urlTemplate.indexOf('{x}') >= 0 &&
      this.state.urlTemplate.indexOf('{y}') >= 0 &&
      this.state.urlTemplate.indexOf('{z}') >= 0;

    if (canPreview && this.state.layerName) {
      this.props.onSourceConfigChange({
        urlTemplate: this.state.urlTemplate,
        layerName: this.state.layerName,
        minSourceZoom: this.state.minSourceZoom,
        maxSourceZoom: this.state.maxSourceZoom,
        fields: this.state.fields,
      });
    }
  }, 200);

  _handleUrlTemplateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    this.setState(
      {
        urlTemplate: url,
      },
      () => this._sourceConfigChange()
    );
  };

  _handleChange = (state: {
    layerName: string;
    fields: MVTFieldDescriptor[];
    minSourceZoom: number;
    maxSourceZoom: number;
  }) => {
    this.setState(state, () => this._sourceConfigChange());
  };

  render() {
    return (
      <Fragment>
        <EuiFormRow
          label={i18n.translate('xpack.maps.source.MVTSingleLayerVectorSourceEditor.urlMessage', {
            defaultMessage: 'Url',
          })}
        >
          <EuiFieldText value={this.state.urlTemplate} onChange={this._handleUrlTemplateChange} />
        </EuiFormRow>

        <MVTSingleLayerSourceSettings
          handleChange={this._handleChange}
          layerName={this.state.layerName}
          fields={this.state.fields}
          minSourceZoom={this.state.minSourceZoom}
          maxSourceZoom={this.state.maxSourceZoom}
        />
      </Fragment>
    );
  }
}
