/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { DynamicStyleProperty } from './dynamic_style_property';
import _ from 'lodash';
import { getComputedFieldName } from '../style_util';
import { getColorRampStops, getColorPalette } from '../../color_utils';
import { ColorGradient } from '../../components/color_gradient';
import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiText, EuiToolTip } from '@elastic/eui';
import { VectorIcon } from '../components/legend/vector_icon';
import { VECTOR_STYLES } from '../vector_style_defaults';

export class DynamicColorProperty extends DynamicStyleProperty {
  syncCircleColorWithMb(mbLayerId, mbMap, alpha) {
    const color = this._getMbColor();
    mbMap.setPaintProperty(mbLayerId, 'circle-color', color);
    mbMap.setPaintProperty(mbLayerId, 'circle-opacity', alpha);
  }

  syncIconColorWithMb(mbLayerId, mbMap) {
    const color = this._getMbColor();
    mbMap.setPaintProperty(mbLayerId, 'icon-color', color);
  }

  syncHaloBorderColorWithMb(mbLayerId, mbMap) {
    const color = this._getMbColor();
    mbMap.setPaintProperty(mbLayerId, 'icon-halo-color', color);
  }

  syncCircleStrokeWithMb(pointLayerId, mbMap, alpha) {
    const color = this._getMbColor();
    mbMap.setPaintProperty(pointLayerId, 'circle-stroke-color', color);
    mbMap.setPaintProperty(pointLayerId, 'circle-stroke-opacity', alpha);
  }

  syncFillColorWithMb(mbLayerId, mbMap, alpha) {
    const color = this._getMbColor();
    mbMap.setPaintProperty(mbLayerId, 'fill-color', color);
    mbMap.setPaintProperty(mbLayerId, 'fill-opacity', alpha);
  }

  syncLineColorWithMb(mbLayerId, mbMap, alpha) {
    const color = this._getMbColor();
    mbMap.setPaintProperty(mbLayerId, 'line-color', color);
    mbMap.setPaintProperty(mbLayerId, 'line-opacity', alpha);
  }

  syncLabelColorWithMb(mbLayerId, mbMap, alpha) {
    const color = this._getMbColor();
    mbMap.setPaintProperty(mbLayerId, 'text-color', color);
    mbMap.setPaintProperty(mbLayerId, 'text-opacity', alpha);
  }

  isOrdinal() {
    if (this._options.type === 'PALETTE') {
      return false;
    } else {
      return true;
    }
  }

  isCategorical() {
    return this._options.type === 'PALETTE';
  }

  isCustomColorRamp() {
    return this._options.useCustomColorRamp;
  }

  supportsFeatureState() {
    return true;
  }

  isScaled() {
    return this.isOrdinal() && !this.isCustomColorRamp();
  }

  isRanged() {
    return this.isOrdinal() && !this.isCustomColorRamp();
  }

  hasBreaks() {
    return (this.isOrdinal() && this.isCustomColorRamp()) || this.isCategorical();
  }

  _getMbColor() {
    const isDynamicConfigComplete =
      _.has(this._options, 'field.name') && _.has(this._options, 'color');
    if (!isDynamicConfigComplete) {
      return null;
    }

    return this._getMBDataDrivenColor({
      targetName: getComputedFieldName(this._styleName, this._options.field.name),
    });
  }

  _getMbDataDrivenOrdinalColor({ targetName }) {
    if (
      this._options.useCustomColorRamp &&
      (!this._options.customColorRamp || !this._options.customColorRamp.length)
    ) {
      return null;
    }

    const colorStops = this._getMbOrdinalColorStops();
    if (this._options.useCustomColorRamp) {
      const firstStopValue = colorStops[0];
      const lessThenFirstStopValue = firstStopValue - 1;
      return [
        'step',
        ['coalesce', ['feature-state', targetName], lessThenFirstStopValue],
        'rgba(0,0,0,0)', // MB will assign the base value to any features that is below the first stop value
        ...colorStops,
      ];
    }
    return [
      'interpolate',
      ['linear'],
      ['coalesce', ['feature-state', targetName], -1],
      -1,
      'rgba(0,0,0,0)',
      ...colorStops,
    ];
  }

  _getMbDataDrivenCategoricalColor() {
    if (
      this._options.useCustomColorRamp &&
      (!this._options.customColorRamp || !this._options.customColorRamp.length)
    ) {
      return null;
    }

    if (this._options.useCustomColorRamp && this._options.customColorRamp) {
      const mbStops = [];
      this._options.customColorRamp.forEach(stop => {
        mbStops.push(stop.stop);
        mbStops.push(stop.color);
      });
      mbStops.push('rgba(0,0,0,0)');
      const expression = ['match', ['get', this._options.field.name], ...mbStops];
      return expression;
    } else {
      console.log('get data-driven expression without custom-palette', this._options);
      const fieldMeta = this.getFieldMeta();
      const colors = getColorPalette(this._options.color);

      const maxLength = Math.min(colors.length, fieldMeta.categories.length);
      const mbStops = [];
      for (let i = 0; i < maxLength; i++) {
        mbStops.push(fieldMeta.categories[i].key);
        mbStops.push(colors[i]);
      }
      mbStops.push('rgba(0,0,0,0)');
      const expression = ['match', ['get', this._options.field.name], ...mbStops];
      console.log('expression for palette', expression);
      return expression;
    }
  }

  _getMBDataDrivenColor({ targetName }) {
    if (this._options.type === 'PALETTE') {
      return this._getMbDataDrivenCategoricalColor({ targetName });
    } else {
      return this._getMbDataDrivenOrdinalColor({ targetName });
    }
  }

  _getColorStopsFromCustom() {
    return this._options.customColorRamp.reduce((accumulatedStops, nextStop) => {
      return [...accumulatedStops, nextStop.stop, nextStop.color];
    }, []);
  }

  _getMbOrdinalColorStops() {
    console.log('get color stops');
    if (this._options.useCustomColorRamp) {
      return this._getColorStopsFromCustom();
    } else {
      return getColorRampStops(this._options.color);
    }
  }

  renderRangeLegendHeader() {
    if (this._options.color) {
      return <ColorGradient colorRampName={this._options.color} />;
    } else {
      return null;
    }
  }

  _renderStopIcon(color, isLinesOnly, isPointsOnly, symbolId) {
    if (this.getStyleName() === VECTOR_STYLES.LABEL_COLOR) {
      const style = { color: color };
      return (
        <EuiText size={'xs'} style={style}>
          Tx
        </EuiText>
      );
    }

    const loadIsLinesOnly = () => {
      return isLinesOnly;
    };

    const loadIsPointsOnly = () => {
      return isPointsOnly;
    };

    const getColorForProperty = (styleProperty, isLinesOnly) => {
      if (isLinesOnly) {
        return color;
      }

      return this.getStyleName() === styleProperty ? color : 'none';
    };

    return (
      <VectorIcon
        symbolId={symbolId}
        loadIsPointsOnly={loadIsPointsOnly}
        loadIsLinesOnly={loadIsLinesOnly}
        getColorForProperty={getColorForProperty}
      />
    );
  }

  _renderColorbreaks({ isLinesOnly, isPointsOnly, symbolId }) {
    if (!this._options.customColorRamp) {
      return null;
    }

    return this._options.customColorRamp.map((config, index) => {
      const value = this.formatField(config.stop);
      return (
        <EuiFlexItem key={index}>
          <EuiFlexGroup direction={'row'} gutterSize={'none'}>
            <EuiFlexItem>
              <EuiText size={'xs'}>{value}</EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              {this._renderStopIcon(config.color, isLinesOnly, isPointsOnly, symbolId)}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      );
    });
  }

  renderBreakedLegend({ fieldLabel, isPointsOnly, isLinesOnly, symbolId }) {
    return (
      <div>
        <EuiSpacer size="s" />
        <EuiFlexGroup direction={'column'} gutterSize={'none'}>
          {this._renderColorbreaks({
            isPointsOnly,
            isLinesOnly,
            symbolId,
          })}
        </EuiFlexGroup>
        <EuiFlexGroup gutterSize="xs" justifyContent="spaceAround">
          <EuiFlexItem grow={false}>
            <EuiToolTip position="top" title={this.getDisplayStyleName()} content={fieldLabel}>
              <EuiText className="eui-textTruncate" size="xs" style={{ maxWidth: '180px' }}>
                <small>
                  <strong>{fieldLabel}</strong>
                </small>
              </EuiText>
            </EuiToolTip>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}
