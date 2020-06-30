/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
/* eslint-disable @typescript-eslint/consistent-type-definitions */

import React, { Fragment, Component, ChangeEvent } from 'react';
import { EuiFieldText, EuiFormRow } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import _ from 'lodash';
import { MAX_ZOOM, MIN_ZOOM } from '../../../../common/constants';
import { ValidatedDualRange, Value } from '../../../../../../../src/plugins/kibana_react/public';
import { MVTFieldConfigEditor } from './mvt_field_config_editor';
import { MVTFieldDescriptor } from '../../../../common/descriptor_types';

export type MVTSettings = {
  layerName: string;
  fields: MVTFieldDescriptor[];
  minSourceZoom: number;
  maxSourceZoom: number;
};

export interface State {
  currentLayerName: string;
  currentMinSourceZoom: number;
  currentMaxSourceZoom: number;
  currentFields: MVTFieldDescriptor[];
}

export interface Props {
  handleChange: (args: MVTSettings) => void;
  layerName: string;
  fields: MVTFieldDescriptor[];
  minSourceZoom: number;
  maxSourceZoom: number;
  showFields: boolean;
}

export class MVTSingleLayerSourceSettings extends Component<Props, State> {
  // Tracking in state to allow for debounce.
  // Changes to layer-name and/or min/max zoom require heavy operation at map-level (removing and re-adding all sources/layers)
  // To preserve snappyness of typing, debounce the dispatches.
  state = {
    currentLayerName: this.props.layerName,
    currentMinSourceZoom: this.props.minSourceZoom,
    currentMaxSourceZoom: this.props.maxSourceZoom,
    currentFields: _.cloneDeep(this.props.fields),
  };

  _handleChange = _.debounce(() => {
    this.props.handleChange({
      layerName: this.state.currentLayerName,
      minSourceZoom: this.state.currentMinSourceZoom,
      maxSourceZoom: this.state.currentMaxSourceZoom,
      fields: this.state.currentFields,
    });
  }, 200);

  _handleLayerNameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ currentLayerName: e.target.value }, this._handleChange);
  };

  _handleFieldChange = (fields: MVTFieldDescriptor[]) => {
    this.setState({ currentFields: fields }, this._handleChange);
  };

  _handleZoomRangeChange = (e: Value) => {
    this.setState(
      {
        currentMinSourceZoom: parseInt(e[0] as string, 10),
        currentMaxSourceZoom: parseInt(e[1] as string, 10),
      },
      this._handleChange
    );
  };

  render() {
    const fieldEditor =
      this.props.showFields && this.state.currentLayerName !== '' ? (
        <EuiFormRow
          label={i18n.translate(
            'xpack.maps.source.MVTSingleLayerVectorSourceEditor.fieldsMessage',
            {
              defaultMessage: 'Fields',
            }
          )}
          helpText={i18n.translate(
            'xpack.maps.source.MVTSingleLayerVectorSourceEditor.fieldsHelpMessage',
            {
              defaultMessage:
                'Fields which are available in the `{layer}` layer. These can be used for tooltips and dynamic styling.',
              values: {
                layer: this.state.currentLayerName,
              },
            }
          )}
        >
          <MVTFieldConfigEditor
            fields={this.state.currentFields.slice()}
            onChange={this._handleFieldChange}
          />
        </EuiFormRow>
      ) : null;

    return (
      <Fragment>
        <EuiFormRow
          label={i18n.translate(
            'xpack.maps.source.MVTSingleLayerVectorSourceEditor.layerNameMessage',
            {
              defaultMessage: 'Tile layer',
            }
          )}
        >
          <EuiFieldText
            value={this.state.currentLayerName}
            onChange={this._handleLayerNameInputChange}
            isInvalid={this.state.currentLayerName === ''}
          />
        </EuiFormRow>
        <EuiFormRow
          label={i18n.translate(
            'xpack.maps.source.MVTSingleLayerVectorSourceEditor.zoomRangeTopMessage',
            {
              defaultMessage: 'Available levels',
            }
          )}
          helpText={i18n.translate(
            'xpack.maps.source.MVTSingleLayerVectorSourceEditor.zoomRangeHelpMessage',
            {
              defaultMessage:
                'Zoom levels where the layer is present in the tiles. This does not correspond directly to visibility. Layer data from lower levels can always be displayed at higher zoom levels (but not vice versa).',
            }
          )}
        >
          <ValidatedDualRange
            label=""
            formRowDisplay="columnCompressed"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            value={[this.state.currentMinSourceZoom, this.state.currentMaxSourceZoom]}
            showInput="inputWithPopover"
            showRange
            showLabels
            onChange={this._handleZoomRangeChange}
            allowEmptyRange={false}
            compressed
            prepend={i18n.translate(
              'xpack.maps.source.MVTSingleLayerVectorSourceEditor.dataZoomRangeMessage',
              {
                defaultMessage: 'Zoom',
              }
            )}
          />
        </EuiFormRow>
        {fieldEditor}
      </Fragment>
    );
  }
}
