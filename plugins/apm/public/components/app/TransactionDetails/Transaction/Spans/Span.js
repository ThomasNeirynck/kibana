import React from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import { toQuery, fromQuery, RelativeLink } from '../../../../../utils/url';
import SpanDetails from './SpanDetails';
import Modal from '../../../../shared/Modal';

import {
  unit,
  units,
  colors,
  px,
  fontFamilyCode,
  fontSizes
} from '../../../../../style/variables';
import {
  SPAN_DURATION,
  SPAN_START,
  SPAN_ID,
  SPAN_NAME
} from '../../../../../../common/constants';

const SpanBar = styled.div`
  position: relative;
  height: ${unit}px;
`;
const SpanLabel = styled.div`
  white-space: nowrap;
  position: relative;
  direction: rtl;
  text-align: left;
  margin: ${px(units.quarter)} 0 0;
  font-family: ${fontFamilyCode};
  font-size: ${fontSizes.small};
`;

const Container = styled(({ isSelected, timelineMargins, ...props }) => (
  <RelativeLink {...props} />
))`
  position: relative;
  display: block;
  user-select: none;
  padding: ${px(units.half)} ${props => px(props.timelineMargins.right)}
    ${px(units.eighth)} ${props => px(props.timelineMargins.left)};
  border-top: 1px solid ${colors.gray4};
  background-color: ${props => (props.isSelected ? colors.gray5 : 'initial')};
  &:hover {
    background-color: ${colors.gray5};
  }
`;

class Span extends React.Component {
  onClose = () => {
    const { location, history } = this.props;
    const { spanId, ...currentQuery } = toQuery(location.search);
    history.replace({
      ...location,
      search: fromQuery({
        ...currentQuery,
        spanId: null
      })
    });
  };

  render() {
    const {
      timelineMargins,
      totalDuration,
      span,
      color,
      isSelected,
      transactionId
    } = this.props;

    const width = get({ span }, SPAN_DURATION) / totalDuration * 100;
    const left = get({ span }, SPAN_START) / totalDuration * 100;

    const spanId = get({ span }, SPAN_ID);
    const spanName = get({ span }, SPAN_NAME);

    return (
      <Container
        query={{ spanId }}
        timelineMargins={timelineMargins}
        isSelected={isSelected}
      >
        <SpanBar
          style={{
            left: `${left}%`,
            width: `${width}%`,
            backgroundColor: color
          }}
        />
        <SpanLabel style={{ left: `${left}%`, width: `${100 - left}%` }}>
          {spanName}
        </SpanLabel>

        <Modal
          header="Span details"
          isOpen={isSelected}
          onClose={this.onClose}
          close={this.onClose}
        >
          <SpanDetails
            span={span}
            totalDuration={totalDuration}
            transactionId={transactionId}
          />
        </Modal>
      </Container>
    );
  }
}

SpanDetails.propTypes = {
  totalDuration: PropTypes.number.isRequired
};

export default withRouter(Span);
