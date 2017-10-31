import React from 'react';
import styled from 'styled-components';
import numeral from 'numeral';
import { get } from 'lodash';
import { KuiButton } from 'ui_framework/components';
import Stacktrace from '../../../../../shared/Stacktrace';
import {
  TRACE_DURATION,
  TRACE_NAME
} from '../../../../../../../common/constants';
import {
  unit,
  units,
  px,
  colors,
  fontSizes
} from '../../../../../../style/variables';

const DetailsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid ${colors.gray4};
  padding: ${px(unit)} 0;
  position: relative;
`;

const DetailsHeader = styled.div`
  font-weight: 100;
  font-size: ${fontSizes.small};
  color: ${colors.gray1};
  margin-bottom: ${units.quarter};
`;

const DetailsText = styled.div`
  font-size: ${fontSizes.large};
`;

const StackTraceContainer = styled.div`
  margin-top: ${unit}px;
`;

function TraceDetails({ trace, totalDuration }) {
  const traceDuration = get({ trace }, TRACE_DURATION);
  const relativeDuration = traceDuration / totalDuration;
  const traceName = get({ trace }, TRACE_NAME);
  const stackframes = trace.stacktrace;
  const codeLanguage = get(trace, 'context.app.language.name');

  return (
    <div>
      <DetailsWrapper>
        <div>
          <DetailsHeader>Trace name</DetailsHeader>
          <DetailsText>{traceName}</DetailsText>
        </div>
        <div>
          <DetailsHeader>Trace duration</DetailsHeader>
          <DetailsText>
            {numeral(traceDuration / 1000).format('0.00')} ms
          </DetailsText>
        </div>
        <div>
          <DetailsHeader>% of total time</DetailsHeader>
          <DetailsText>{numeral(relativeDuration).format('0.00%')}</DetailsText>
        </div>
        <KuiButton buttonType="secondary">Open trace in Discover</KuiButton>
      </DetailsWrapper>

      <StackTraceContainer>
        <Stacktrace stackframes={stackframes} codeLanguage={codeLanguage} />
      </StackTraceContainer>
    </div>
  );
}

export default TraceDetails;
