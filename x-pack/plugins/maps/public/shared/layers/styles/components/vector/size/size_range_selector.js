/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  EuiFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiDualRange
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { DEFAULT_MIN_SIZE, DEFAULT_MAX_SIZE } from '../../../vector_style_defaults';

export function SizeRangeSelector({ minSize, maxSize, onChange }) {

  const onSizeChange = ([min, max]) => {
    onChange({
      minSize: Math.max(DEFAULT_MIN_SIZE, parseInt(min, 10)),
      maxSize: Math.min(DEFAULT_MAX_SIZE, parseInt(max, 10))
    });
  };

  return (
    <EuiFlexGroup>
      <EuiFlexItem>
        <EuiFormRow
          label={
            i18n.translate('xpack.maps.styles.vector.size.minMaxLabel', {
              defaultMessage: 'Min and max size'
            })
          }
          compressed
        >
          <EuiDualRange
            min={DEFAULT_MIN_SIZE}
            max={DEFAULT_MAX_SIZE}
            step={1}
            value={[minSize, maxSize]}
            showInput
            onChange={onSizeChange}
          />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

SizeRangeSelector.propTypes = {
  minSize: PropTypes.number.isRequired,
  maxSize: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
