/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { connect } from 'react-redux';
import { FlyoutFooter } from './view';
import { updateFlyout, FLYOUT_STATE } from '../../../store/ui';
import {
  promoteTemporaryStyles,
  clearTemporaryLayers,
  setSelectedLayer,
  removeSelectedLayer,
  promoteTemporaryLayers,
  rollbackToTrackedLayerStateForSelectedLayer,
  removeTrackedLayerStateForSelectedLayer
} from '../../../actions/store_actions';
import { getSelectedLayer } from '../../../selectors/map_selectors';

const mapStateToProps = state => {
  const selectedLayer = getSelectedLayer(state);
  return {
    isNewLayer: selectedLayer.isTemporary()
  };
};

const mapDispatchToProps = dispatch => {
  return {
    cancelLayerPanel: async () => {
      await dispatch(updateFlyout(FLYOUT_STATE.NONE));
      await dispatch(clearTemporaryLayers());
      await dispatch(rollbackToTrackedLayerStateForSelectedLayer());
    },
    saveLayerEdits: isNewLayer => {
      dispatch(updateFlyout(FLYOUT_STATE.NONE));
      dispatch(promoteTemporaryStyles());
      if (isNewLayer) {
        dispatch(promoteTemporaryLayers());
      }
      dispatch(removeTrackedLayerStateForSelectedLayer());
      dispatch(setSelectedLayer(null));
    },
    removeLayer: () => {
      dispatch(updateFlyout(FLYOUT_STATE.NONE));
      dispatch(removeSelectedLayer());
      dispatch(setSelectedLayer(null));
    }
  };
};

const connectedFlyoutFooter = connect(mapStateToProps, mapDispatchToProps)(FlyoutFooter);
export { connectedFlyoutFooter as FlyoutFooter };
