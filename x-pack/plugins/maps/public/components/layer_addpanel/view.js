/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Component, Fragment } from 'react';
import { ALL_SOURCES } from '../../shared/layers/sources/all_sources';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiPanel,
  EuiSpacer,
  EuiCard,
  EuiIcon,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';


export class AddLayerPanel extends Component {

  state = {
    sourceType: null,
    isLoading: false,
    hasLayerSelected: false,
    layer: null
  }

  _previewLayer = (source) => {
    if (!source) {
      this.setState({ layer: null });
      this.props.removeTransientLayer();
      return;
    }

    this.setState({
      layer: source.createDefaultLayer({}, this.props.mapColors)
    },
    () => this.props.previewLayer(this.state.layer));
  };

  _clearSource = () => {
    this.setState({ sourceType: null });

    if (this.state.layer) {
      this.props.removeTransientLayer();
    }
  }

  _onSourceTypeChange = (sourceType) => {
    this.setState({ sourceType });
  }

  _renderNextBtn() {
    if (!this.state.sourceType) {
      return null;
    }

    const {  hasLayerSelected, isLoading, selectLayerAndAdd } = this.props;
    return (
      <EuiButton
        disabled={!hasLayerSelected}
        isLoading={hasLayerSelected && isLoading}
        iconSide="right"
        iconType={'sortRight'}
        onClick={() => {
          this.setState({ layer: null });
          selectLayerAndAdd();
        }}
        fill
      >
        <FormattedMessage
          id="xpack.maps.addLayerPanel.addLayerInWizard"
          defaultMessage="Add layer"
        />
      </EuiButton>
    );
  }

  _renderSourceCards() {
    return ALL_SOURCES.map(Source => {
      const icon = Source.icon
        ? <EuiIcon type={Source.icon} size="l" />
        : null;
      return (
        <Fragment key={Source.type}>
          <EuiSpacer size="s" />
          <EuiCard
            className="mapLayerAddpanel__card"
            title={Source.title}
            icon={icon}
            onClick={() => this._onSourceTypeChange(Source.type)}
            description={Source.description}
            layout="horizontal"
          />
        </Fragment>
      );
    });
  }

  _renderSourceSelect() {
    return (
      <Fragment>
        <EuiTitle size="xs">
          <h2>Choose data source</h2>
        </EuiTitle>
        {this._renderSourceCards()}
      </Fragment>
    );
  }

  _renderSourceEditor() {
    const editorProperties = {
      onPreviewSource: this._previewLayer,
      inspectorAdapters: this.props.inspectorAdapters,
    };

    const Source = ALL_SOURCES.find((Source) => {
      return Source.type === this.state.sourceType;
    });
    if (!Source) {
      throw new Error(`Unexepected source type: ${this.state.sourceType}`);
    }

    return (
      <Fragment>
        <EuiButtonEmpty
          size="xs"
          flush="left"
          onClick={this._clearSource}
          iconType="arrowLeft"
        >
          <FormattedMessage
            id="xpack.maps.addLayerPanel.changeDataSourceButton"
            defaultMessage="Change data source"
          />
        </EuiButtonEmpty>
        <EuiSpacer size="s" />
        <EuiPanel>
          {Source.renderEditor(editorProperties)}
        </EuiPanel>
      </Fragment>
    );
  }

  _renderAddLayerForm() {
    if (!this.state.sourceType) {
      return this._renderSourceSelect();
    }

    return this._renderSourceEditor();
  }

  _renderFlyout() {
    return (
      <EuiFlexGroup
        direction="column"
        gutterSize="none"
      >
        <EuiFlyoutHeader hasBorder className="mapLayerPanel__header">
          <EuiTitle size="s">
            <h2>
              <FormattedMessage
                id="xpack.maps.addLayerPanel.addLayerTitleInFlyout"
                defaultMessage="Add layer"
              />
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>

        <EuiFlyoutBody className="mapLayerPanel__body">
          {this._renderAddLayerForm()}
        </EuiFlyoutBody>

        <EuiFlyoutFooter className="mapLayerPanel__footer">
          <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                onClick={() => {
                  if (this.state.layer) {
                    this.props.closeFlyout();
                  }
                }}
                flush="left"
              >
                Cancel
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {this._renderNextBtn()}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlexGroup>
    );
  }

  render() {
    return (this.props.flyoutVisible) ? this._renderFlyout() : null;
  }
}
