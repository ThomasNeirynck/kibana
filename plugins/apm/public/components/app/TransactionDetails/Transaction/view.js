import React, { Component } from 'react';
import styled from 'styled-components';
import { STATUS } from '../../../../constants';
import { units, colors, px, borderRadius } from '../../../../style/variables';
import { Tab } from '../../../shared/UIComponents';
import { capitalize, get } from 'lodash';

import { Properties } from '../../../shared/ContextProperties';
import {
  PropertiesTable,
  getLevelOneProps
} from '../../../shared/PropertiesTable';
import Spans from './Spans';
import DiscoverButton from '../../../shared/DiscoverButton';
import {
  TRANSACTION_ID,
  SERVICE_AGENT_NAME
} from '../../../../../common/constants';

function loadTransaction(props) {
  const { serviceName, start, end, transactionId } = props.urlParams;
  if (
    serviceName &&
    start &&
    end &&
    transactionId &&
    !props.transactionNext.status
  ) {
    props.loadTransaction({ serviceName, start, end, transactionId });
  }
}

const Container = styled.div`
  position: relative;
  border: 1px solid ${colors.gray4};
  border-radius: ${borderRadius};
  margin-top: ${px(units.plus)};
`;

const TabContainer = styled.div`
  padding: 0 ${px(units.plus)};
  border-bottom: 1px solid ${colors.gray4};
`;

const TabContentContainer = styled.div`
  background-color: ${colors.white};
  overflow: hidden;
  border-radius: 0 0 ${borderRadius} ${borderRadius};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${px(units.plus)};
`;

const Title = styled.h3`
  margin-top: -${px(units.quarter)};
`;

const PropertiesTableContainer = styled.div`
  padding: ${px(units.plus)} ${px(units.plus)} 0;
`;

const DEFAULT_TAB = 'timeline';

// Ensure the selected tab exists or use the default
function getCurrentTab(tabs = [], detailTab) {
  return tabs.includes(detailTab) ? detailTab : DEFAULT_TAB;
}

function getTabs(transactionData) {
  const dynamicProps = Object.keys(transactionData.context || {});
  return getLevelOneProps(dynamicProps);
}

class Transaction extends Component {
  componentDidMount() {
    loadTransaction(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadTransaction(nextProps);
  }

  render() {
    const { transaction } = this.props;
    const { transactionId } = this.props.urlParams;

    if (transaction.status !== STATUS.SUCCESS) {
      return null;
    }

    const timestamp = get(transaction, 'data.@timestamp');
    const url = get(transaction.data, 'context.request.url.raw', 'N/A');

    const agentName = get(transaction.data, SERVICE_AGENT_NAME);

    const tabs = getTabs(transaction.data);
    const currentTab = getCurrentTab(tabs, this.props.urlParams.detailTab);

    const discoverQuery = {
      _a: {
        interval: 'auto',
        query: {
          language: 'lucene',
          query: `${TRANSACTION_ID}:${transactionId}`
        },
        sort: { '@timestamp': 'desc' }
      }
    };

    return (
      <Container>
        <Header>
          <Title>Transaction sample</Title>
          <DiscoverButton query={discoverQuery}>
            {`View transaction in Discover`}
          </DiscoverButton>
        </Header>

        <Properties timestamp={timestamp} url={url} />

        <TabContainer>
          {[DEFAULT_TAB, ...tabs].map(key => {
            return (
              <Tab
                query={{ detailTab: key }}
                selected={currentTab === key}
                key={key}
              >
                {capitalize(key)}
              </Tab>
            );
          })}
        </TabContainer>

        <TabContentContainer>
          {currentTab === DEFAULT_TAB ? (
            <Spans />
          ) : (
            <PropertiesTableContainer>
              <PropertiesTable
                propData={get(transaction.data.context, currentTab)}
                propKey={currentTab}
                agentName={agentName}
              />
            </PropertiesTableContainer>
          )}
        </TabContentContainer>
      </Container>
    );
  }
}

export default Transaction;
