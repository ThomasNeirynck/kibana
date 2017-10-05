import React from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import STATIC_PROPS from './staticProperties.json';
import { unit, units, colors } from '../../../style/variables';
import TipMessage from '../TipMessage';

const Table = styled.table`
  font-family: monospace;
  width: 100%;
`;
const Row = styled.tr`
  border-bottom: 1px solid ${colors.gray4};
  &:last-child {
    border: 0;
  }
`;
const Cell = styled.td`
  vertical-align: top;
  padding: ${units.quarter}px 0;

  ${Row}:first-child> & {
    padding-top: 0;
  }

  ${Row}:last-child> & {
    padding-bottom: 0;
  }

  &:first-child {
    width: 300px;
    font-weight: bold;
  }
`;
const EmptyValue = styled.span`color: ${colors.gray4};`;

function getSortedProps(propData, levelTwoKey, level) {
  if (level === 2) {
    return getLevelTwoProps(propData, levelTwoKey);
  }

  return _.sortBy(_.map(propData, (value, key) => ({ value, key })), 'key');
}

function formatValue(value) {
  if (_.isObject(value)) {
    return <pre>{JSON.stringify(value, null, 4)}</pre>;
  } else if (_.isBoolean(value)) {
    return String(value);
  } else if (!value) {
    return <EmptyValue>N/A</EmptyValue>;
  }

  return value;
}

function formatKey(key, value) {
  if (value == null) {
    return <EmptyValue>{key}</EmptyValue>;
  }

  return key;
}

export function getLevelOneProps(dynamicProps) {
  return STATIC_PROPS.filter(
    ({ key, required }) => required || dynamicProps.includes(key)
  ).map(({ key }) => key);
}

function getLevelTwoProps(dynamicProps, currentKey) {
  const staticProps = _.get(
    _.find(STATIC_PROPS, { key: currentKey }),
    'children'
  );
  const dynamicPropsSorted = Object.keys(dynamicProps).sort();
  return _.uniq([...staticProps, ...dynamicPropsSorted]).map(key => ({
    key,
    value: dynamicProps[key]
  }));
}

function getTip(propertyKey) {
  switch (propertyKey) {
    case 'user':
      return 'You can configure your agent to add contextual information about your users';

    case 'tags':
      return 'You can configure your agent to add filterable tags on transactions';

    case 'custom':
      return 'You can configure your agent to add custom contextual information on transactions';

    default:
      return null;
  }
}

function recursiveSort(propData, levelTwoKey, level) {
  const tipHeading = getTip(levelTwoKey);

  return (
    <div>
      <Table>
        <tbody>
          {getSortedProps(
            propData,
            levelTwoKey,
            level
          ).map(({ key, value }) => {
            return (
              <Row key={key}>
                <Cell>{formatKey(key, value)}</Cell>
                <Cell>
                  {level < 3 && _.isObject(value)
                    ? recursiveSort(value, levelTwoKey, level + 1)
                    : formatValue(value)}
                </Cell>
              </Row>
            );
          })}
        </tbody>
      </Table>

      {tipHeading && (
        <TipMessage
          heading={tipHeading}
          link="https://www.elastic.co/guide/en/apm/get-started/current/index.html"
        />
      )}
    </div>
  );
}

export function PropertiesTable({ propData, propKey }) {
  if (!propData) {
    return <div>No data</div>;
  }

  return (
    <div style={{ padding: `${unit}px` }}>
      {recursiveSort(propData, propKey, 2)}
    </div>
  );
}
