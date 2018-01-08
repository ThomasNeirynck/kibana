import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

import {
  unit,
  units,
  px,
  fontSizes,
  colors,
  truncate
} from '../../style/variables';

const PropertiesContainer = styled.div`
  display: flex;
  padding: 0 ${px(units.plus)};
  width: 100%;
  justify-content: flex-start;
  flex-wrap: wrap;
`;

const Property = styled.div`
  width: 33%;
  margin-bottom: ${px(units.double)};
`;

const PropertyWide = Property.extend`
  width: 66%;
`;

const PropertyLabel = styled.div`
  margin-bottom: ${px(units.half)};
  font-size: ${fontSizes.small};
  color: ${colors.gray3};
`;

const PropertyValue = styled.div`
  display: inline-block;
  line-height: ${px(unit)};
`;

const PropertyValueEmphasis = styled.span`
  color: ${colors.gray3};
`;

const PropertyUrl = styled.span`
  display: inline-block;
  ${truncate(px(unit * 35))};
  line-height: ${px(unit)};
`;

export function ContextProperties({ timestamp, url, stickyProperties }) {
  const time = moment(timestamp);
  const timestampAgo = timestamp ? time.fromNow() : 'N/A';
  const timestampFull = timestamp
    ? time.format('MMMM Do YYYY, HH:mm:ss.SSS')
    : 'N/A';

  return (
    <PropertiesContainer>
      <Property>
        <PropertyLabel>@timestamp</PropertyLabel>
        <PropertyValue>
          {timestampAgo}{' '}
          <PropertyValueEmphasis>({timestampFull})</PropertyValueEmphasis>
        </PropertyValue>
      </Property>
      <PropertyWide>
        <PropertyLabel>context.request.url.full</PropertyLabel>
        <PropertyUrl title={url}>{url}</PropertyUrl>
      </PropertyWide>
      {stickyProperties &&
        stickyProperties.map(({ name, val }, i) => (
          <Property key={i}>
            <PropertyLabel>{name}</PropertyLabel>
            <PropertyValue>{String(val)}</PropertyValue>
          </Property>
        ))}
    </PropertiesContainer>
  );
}
