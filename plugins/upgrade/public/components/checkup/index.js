import React, { Component } from 'react';

import { RefreshButton } from '../refresh_button';
import { CheckupOutput } from './output';
import { ErrorPanel } from '../error_panel';
import { CheckupInfo } from './info';
import { InfoGroup } from '../info_group';
import { LOADING_STATUS } from '../../lib/constants';
import { getDeprecations } from '../../lib';
import { withViewState } from '../../lib/util/view_state';


export const CheckupView = withViewState({
  initialState: {
    isInfoCollapsed: false,
  },
  updaters: {
    toggleInfoCollapsed: (state) => () => ({
      isInfoCollapsed: !state.isInfoCollapsed,
    }),
  },
})(class CheckupView extends Component {
  static propTypes = {
    isInfoCollapsed: React.PropTypes.bool,
    toggleInfoCollapsed: React.PropTypes.func,
  }

  static defaultProps = {
    isInfoCollapsed: false,
    toggleInfoCollapsed: () => {},
  }

  state = {
    deprecations: undefined,
    lastError: undefined,
    loadingStatus: LOADING_STATUS.UNINITIALIZED,
  };

  runCheckup = async () => {
    this.setState({
      loadingStatus: LOADING_STATUS.LOADING,
    });

    try {
      const deprecations = await getDeprecations();

      this.setState({
        deprecations,
        loadingStatus: LOADING_STATUS.SUCCESS,
      });
    } catch (error) {
      this.setState({
        lastError: error,
        loadingStatus: LOADING_STATUS.FAILURE,
      });
    }
  }

  componentDidMount() {
    this.runCheckup();
  }

  render() {
    const { deprecations, lastError, loadingStatus } = this.state;
    const { isInfoCollapsed, toggleInfoCollapsed } = this.props;

    return (
      <div className="kuiView">
        <div className="kuiViewContent kuiViewContent--constrainedWidth">
          <div className='kuiViewContentItem'>
            <InfoGroup
              className="kuiVerticalRhythm"
              isCollapsed={ isInfoCollapsed }
              onChangeCollapsed={ toggleInfoCollapsed }
              title="Cluster Checkup"
            >
              <CheckupInfo className="kuiVerticalRhythm" />
            </InfoGroup>

            <RefreshButton
              buttonLabel="Rerun Checkup"
              className="kuiVerticalRhythm"
              onClick={ this.runCheckup }
            />

            {
              loadingStatus === LOADING_STATUS.FAILURE
                ? <ErrorPanel
                    className="kuiVerticalRhythm"
                    title="Failed to run checkup"
                  >
                    <p className="kuiText">{ lastError.message }</p>
                  </ErrorPanel>
                : null
            }

            {
              loadingStatus === LOADING_STATUS.SUCCESS
                ? <CheckupOutput className="kuiVerticalRhythm" output={ deprecations } />
                : null
            }
          </div>
        </div>
      </div>
    );
  }
});
