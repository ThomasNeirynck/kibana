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

export type MVTSingleLayerVectorSourceConfig = {
  urlTemplate: string;
  layerName: string;
  minSourceZoom: number;
  maxSourceZoom: number;
};

export interface Props {
  onSourceConfigChange: (sourceConfig: MVTSingleLayerVectorSourceConfig) => void;
}

interface State {
  urlTemplate: string;
  layerName: string;
  minSourceZoom: number;
  maxSourceZoom: number;
  mvtCanPreview: boolean;
}

export class MVTVectorSourceEditor extends Component<Props, State> {
  state = {
    urlTemplate: '',
    layerName: '',
    minSourceZoom: MIN_ZOOM,
    maxSourceZoom: MAX_ZOOM,
    mvtCanPreview: false,
  };

  _sourceConfigChange = _.debounce(() => {
    if (this.state.mvtCanPreview && this.state.layerName) {
      this.props.onSourceConfigChange({
        urlTemplate: this.state.urlTemplate,
        layerName: this.state.layerName,
        minSourceZoom: this.state.minSourceZoom,
        maxSourceZoom: this.state.maxSourceZoom,
      });
    }
  }, 200);

  // @ts-ignore
  _handleUrlTemplateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const canPreview =
      url.indexOf('{x}') >= 0 && url.indexOf('{y}') >= 0 && url.indexOf('{z}') >= 0;
    this.setState(
      {
        urlTemplate: url,
        mvtCanPreview: canPreview,
      },
      () => this._sourceConfigChange()
    );
  };

  // @ts-ignore
  _handleLayerNameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const layerName = e.target.value;
    this.setState(
      {
        layerName,
      },
      () => this._sourceConfigChange()
    );
  };

  _handleZoomRangeChange = (e: Value) => {
    const minSourceZoom = parseInt(e[0] as string, 10);
    const maxSourceZoom = parseInt(e[1] as string, 10);

    if (this.state.minSourceZoom !== minSourceZoom || this.state.maxSourceZoom !== maxSourceZoom) {
      this.setState({ minSourceZoom, maxSourceZoom }, () => this._sourceConfigChange());
    }
  };

  render() {
    return (
      <Fragment>
        <EuiFormRow label="Url">
          <EuiFieldText value={this.state.urlTemplate} onChange={this._handleUrlTemplateChange} />
        </EuiFormRow>
        <EuiFormRow label="Layer name">
          <EuiFieldText value={this.state.layerName} onChange={this._handleLayerNameInputChange} />
        </EuiFormRow>
        <ValidatedDualRange
          label={i18n.translate('xpack.maps.source.mvtVectorSource.sourceZoomRangeLabel', {
            defaultMessage: 'Zoom range for layer data',
          })}
          formRowDisplay="columnCompressed"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          value={[this.state.minSourceZoom, this.state.maxSourceZoom]}
          showInput="inputWithPopover"
          showRange
          showLabels
          onChange={this._handleZoomRangeChange}
          allowEmptyRange={false}
          compressed
          prepend={i18n.translate('xpack.maps.source.mvtVectorSource.dataZoomRangeMessage', {
            defaultMessage: 'Zoom levels',
          })}
        />
      </Fragment>
    );
  }
}
