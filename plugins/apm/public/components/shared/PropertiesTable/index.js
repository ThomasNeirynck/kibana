import React from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import STATIC_PROPS from './staticProperties.json';
import {
  units,
  colors,
  px,
  fontFamilyCode,
  fontSizes
} from '../../../style/variables';
import TipMessage from '../TipMessage';

const TableContainer = styled.div`
  padding-bottom: ${px(units.double)};
`;

const Table = styled.table`
  font-family: ${fontFamilyCode};
  font-size: ${fontSizes.small};
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
  padding: ${units.half}px 0;

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

const EmptyValue = styled.span`
  color: ${colors.gray3};
`;

function getSortedProps(propData, levelTwoKey, level) {
  if (level === 2) {
    return getLevelTwoProps(propData, levelTwoKey);
  }

  return _.sortBy(_.map(propData, (value, key) => ({ value, key })), 'key');
}

function formatValue(value) {
  if (_.isObject(value)) {
    return <pre>{JSON.stringify(value, null, 4)}</pre>;
  } else if (_.isBoolean(value) || _.isNumber(value)) {
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

function getTipText(propertyKey, agentName) {
  switch (agentName) {
    case 'nodejs':
      switch (propertyKey) {
        case 'user':
          return {
            text:
              'You can configure your agent to add contextual information about your users',
            url:
              'https://www.elastic.co/guide/en/apm/agent/nodejs/current/agent-api.html#apm-set-user-context'
          };

        case 'tags':
          return {
            text:
              'You can configure your agent to add filterable tags on transactions',
            url:
              'https://www.elastic.co/guide/en/apm/agent/nodejs/current/agent-api.html#apm-set-tag'
          };

        case 'custom':
          return {
            text:
              'You can configure your agent to add custom contextual information on transactions',
            url:
              'https://www.elastic.co/guide/en/apm/agent/nodejs/current/agent-api.html#apm-set-custom-context'
          };

        default:
          return null;
      }

    case 'python':
      switch (propertyKey) {
        case 'user':
          return {
            text:
              'You can configure your agent to add contextual information about your users',
            url:
              'https://www.elastic.co/guide/en/apm/agent/python/current/index.html'
          };

        case 'tags':
          return {
            text:
              'You can configure your agent to add filterable tags on transactions',
            url:
              'https://www.elastic.co/guide/en/apm/agent/python/current/index.html'
          };

        case 'custom':
          return {
            text:
              'You can configure your agent to add custom contextual information on transactions',
            url:
              'https://www.elastic.co/guide/en/apm/agent/python/current/index.html'
          };

        default:
          return null;
      }
  }
}

function recursiveSort(propData, levelTwoKey, level, agentName) {
  const tipText = getTipText(levelTwoKey, agentName);

  return (
    <div>
      <Table>
        <tbody>
          {getSortedProps(propData, levelTwoKey, level).map(
            ({ key, value }) => {
              return (
                <Row key={key}>
                  <Cell>{formatKey(key, value)}</Cell>
                  <Cell>
                    {level < 3 && _.isObject(value)
                      ? recursiveSort(value, levelTwoKey, level + 1, agentName)
                      : formatValue(value)}
                  </Cell>
                </Row>
              );
            }
          )}
        </tbody>
      </Table>

      {tipText && (
        <TipMessage>
          {tipText.text} -{' '}
          <a href={tipText.url} target="_blank">
            Learn more in the documentation
          </a>
        </TipMessage>
      )}
    </div>
  );
}

export function PropertiesTable({ propData = {}, propKey, agentName }) {
  if (!propData) {
    return (
      <TableContainer>
        <TipMessage>No data available</TipMessage>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      {recursiveSort(propData, propKey, 2, agentName)}
    </TableContainer>
  );
}
