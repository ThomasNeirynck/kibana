/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import PropTypes from 'prop-types';

import { EuiFieldText } from '@elastic/eui';
import {
  addCategoricalRow,
  isCategoricalStopsInvalid,
  DEFAULT_CUSTOM_COLOR,
  DEFAULT_NEXT_COLOR,
} from './color_stops_utils';
import { i18n } from '@kbn/i18n';
import { ColorStops } from './color_stops';

export const ColorStopsCategorical = ({
  colorStops = [
    { stop: null, color: DEFAULT_CUSTOM_COLOR }, //first stop is the "other" color
    { stop: '', color: DEFAULT_NEXT_COLOR },
  ],
  onChange,
}) => {
  const sanitizeStopInput = value => {
    return value;
  };

  const getStopError = (stop, index) => {
    let count = 0;
    for (let i = 1; i < colorStops.length; i++) {
      if (colorStops[i].stop === stop && i !== index) {
        count++;
      }
    }

    return count
      ? i18n.translate('xpack.maps.styles.colorStops.categoricalStop.noDupesWarningLabel', {
          defaultMessage: 'Stops should have unique values',
        })
      : null;
  };

  const renderStopInput = (stop, onStopChange, index) => {
    let stopInput;
    if (index === 0) {
      stopInput = (
        <EuiFieldText
          aria-label={i18n.translate(
            'xpack.maps.styles.colorStops.categoricalStop.defaultCategoryAriaLabel',
            {
              defaultMessage: 'Default stop',
            }
          )}
          value={stop}
          placeholder={i18n.translate(
            'xpack.maps.styles.colorStops.categoricalStop.defaultCategoryPlaceholder',
            {
              defaultMessage: 'Default',
            }
          )}
          disabled
          onChange={onStopChange}
          compressed
        />
      );
    } else {
      stopInput = (
        <EuiFieldText
          aria-label={i18n.translate(
            'xpack.maps.styles.colorStops.categoricalStop.categoryAriaLabel',
            {
              defaultMessage: 'Category',
            }
          )}
          value={stop}
          onChange={onStopChange}
          compressed
        />
      );
    }
    return stopInput;
  };

  const canDeleteStop = (colorStops, index) => {
    return colorStops.length > 2 && index !== 0;
  };

  return (
    <ColorStops
      onChange={onChange}
      colorStops={colorStops}
      isStopsInvalid={isCategoricalStopsInvalid}
      sanitizeStopInput={sanitizeStopInput}
      getStopError={getStopError}
      renderStopInput={renderStopInput}
      canDeleteStop={canDeleteStop}
      addNewRow={addCategoricalRow}
    />
  );
};

ColorStopsCategorical.propTypes = {
  /**
   * Array of { stop, color }.
   * Stops are numbers in strictly ascending order.
   * The range is from the given stop number (inclusive) to the next stop number (exclusive).
   * Colors are color hex strings (3 or 6 character).
   */
  colorStops: PropTypes.arrayOf(
    PropTypes.shape({
      stopKey: PropTypes.number,
      color: PropTypes.string,
    })
  ),
  /**
   * Callback for when the color stops changes. Called with { colorStops, isInvalid }
   */
  onChange: PropTypes.func.isRequired,
};
