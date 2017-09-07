import React, { Component } from 'react';
import PageHeader from '../../shared/PageHeader';
import TabNavigation from '../../shared/TabNavigation';
import Charts from './Charts';
import List from './List';
import Breadcrumbs from '../../shared/Breadcrumbs';
import withErrorHandler from '../../shared/withErrorHandler';

function loadTransactionList(props) {
  const { appName, start, end, transactionType } = props.urlParams;

  if (
    appName &&
    start &&
    end &&
    transactionType &&
    !props.transactionList.status
  ) {
    props.loadTransactionList({ appName, start, end, transactionType });
  }
}

export class TransactionOverview extends Component {
  componentDidMount() {
    loadTransactionList(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadTransactionList(nextProps);
  }

  render() {
    const { appName, transactionType } = this.props.urlParams;
    const { changeTransactionSorting, transactionSorting } = this.props;
    return (
      <div>
        <Breadcrumbs />
        <PageHeader title={appName} />
        <TabNavigation />
        <Charts />
        <h2>Requests</h2>
        <List
          appName={appName}
          type={transactionType}
          list={this.props.transactionList}
          changeTransactionSorting={changeTransactionSorting}
          transactionSorting={transactionSorting}
        />
      </div>
    );
  }
}

export default withErrorHandler(TransactionOverview, ['transactionList']);
