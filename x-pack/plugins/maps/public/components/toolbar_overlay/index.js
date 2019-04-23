/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { connect } from 'react-redux';
import { ToolbarOverlay } from './view';
import { getDrawState, getUniqueIndexPatternIds } from '../../selectors/map_selectors';
import { getIsReadOnly } from '../../store/ui';
import { DRAW_STATE_TYPE, updateDrawStateWithOptions } from '../../actions/store_actions';


function mapStateToProps(state = {}) {
  return {
    isReadOnly: getIsReadOnly(state),
    drawState: getDrawState(state),
    uniqueIndexPatternIds: getUniqueIndexPatternIds(state)
  };
}

function mapDispatchToProps(dispatch) {
  return {
    initiateDraw: (options) => {
      dispatch(updateDrawStateWithOptions(DRAW_STATE_TYPE.ACTIVE, options));
    },

  };
}

const connectedToolbarOverlay = connect(mapStateToProps, mapDispatchToProps)(ToolbarOverlay);
export { connectedToolbarOverlay as ToolbarOverlay };
