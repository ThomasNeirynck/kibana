import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { RefreshButton } from '../refresh_button';
import { LoggingInfo } from './logging_info';
import { ErrorPanel } from '../error_panel';
import { InfoGroup } from '../info_group';
import { LoadingIndicator } from '../loading_indicator';
import { LOADING_STATUS } from '../../lib/constants';
import { getFromApi, putToApi } from '../../lib/request';
import { withViewState } from '../../lib/util/view_state';


export const LoggingView = withViewState({
  initialState: {
    isInfoCollapsed: false,
  },
  updaters: {
    toggleInfoCollapsed: (state) => () => ({
      isInfoCollapsed: !state.isInfoCollapsed,
    }),
  },
})(class LoggingView extends Component {
  static propTypes = {
    isInfoCollapsed: PropTypes.bool,
    toggleInfoCollapsed: PropTypes.func,
  }

  static defaultProps = {
    isInfoCollapsed: false,
    toggleInfoCollapsed: () => {},
  }

  state = {
    isLoggingEnabled: undefined,
    lastError: null,
    loadingStatus: LOADING_STATUS.UNINITIALIZED,
  };

  componentDidMount() {
    this.getLoggingStatus();
  }

  getLoggingStatus = () => {
    this.setState({
      loadingStatus: LOADING_STATUS.LOADING,
    });
    return getFromApi('/api/migration/deprecation_logging')
      .then(
        this.handleSuccess,
        this.handleFailure,
      );
  }

  toggleLogging = () => {
    this.setState({
      loadingStatus: LOADING_STATUS.LOADING,
    });
    return putToApi('/api/migration/deprecation_logging', {
      isEnabled: !this.state.isLoggingEnabled,
    })
      .then(
        this.handleSuccess,
        this.handleFailure,
      );
  }

  handleSuccess = (response) => {
    this.setState({
      isLoggingEnabled: response.isEnabled,
      loadingStatus: LOADING_STATUS.SUCCESS,
    });
  }

  handleFailure = (error) => {
    if (error.statusCode === 403) {
      this.setState({
        loadingStatus: LOADING_STATUS.FORBIDDEN,
      });
    } else {
      this.setState({
        lastError: error.error,
        loadingStatus: LOADING_STATUS.FAILURE,
      });
    }
  }

  render() {
    const { isLoggingEnabled, lastError, loadingStatus } = this.state;
    const { isInfoCollapsed, toggleInfoCollapsed } = this.props;

    return (
      <div className="kuiView">
        <div className="kuiViewContent kuiViewContent--constrainedWidth">
          <div className="kuiViewContentItem">
            { loadingStatus === LOADING_STATUS.FORBIDDEN
                ? (
                  <ErrorPanel
                    className="kuiVerticalRhythm"
                    title="You do not have permission to use the Upgrade Assistant."
                  >
                    <p className="kuiText">Please contact your administrator.</p>
                  </ErrorPanel>
                )
                : null
            }

            <InfoGroup
              className="kuiVerticalRhythm"
              isCollapsed={isInfoCollapsed}
              onChangeCollapsed={toggleInfoCollapsed}
              title="Toggle Deprecation Logging"
            >
              <LoggingInfo className="kuiVerticalRhythm" />
            </InfoGroup>

            {
              loadingStatus !== LOADING_STATUS.FORBIDDEN
                ? (
                  <RefreshButton
                    buttonLabel="Toggle Deprecation Logging"
                    className="kuiVerticalRhythm"
                    onClick={this.toggleLogging}
                  />
                )
                : null
            }

            { loadingStatus === LOADING_STATUS.LOADING
                ? (
                  <LoadingIndicator className="kuiVerticalRhythm" />
                )
                : null
            }

            { loadingStatus === LOADING_STATUS.FAILURE
                ? (
                  <ErrorPanel className="kuiVerticalRhythm">
                    <p className="kuiText">
                      Failed to access logging settings. Please <a className="kuiLink" onClick={this.getLoggingStatus}>reload</a>.
                    </p>
                    <p className="kuiText">{lastError}</p>
                  </ErrorPanel>
                )
                : null
            }

            { loadingStatus === LOADING_STATUS.SUCCESS
                ? (
                  <div className="kuiEvent kuiVerticalRhythm">
                    <span className="kuiEventSymbol">
                      { isLoggingEnabled
                          ? <span className="kuiIcon kuiIcon--success fa-check" />
                          : <span className="kuiIcon kuiIcon--error fa-warning" />
                      }
                    </span>
                    <div className="kuiEventBody">
                      <div className="kuiEventBody__message">
                        Deprecation Logging is&nbsp;
                        { isLoggingEnabled ? "enabled" : "disabled" }
                      </div>
                    </div>
                  </div>
                )
                : null
            }
          </div>
        </div>
      </div>
    );
  }
});
