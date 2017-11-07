import React from 'react';
import { Provider } from 'react-redux';
import { Router, Route, Redirect, Switch } from 'react-router-dom';
import createHistory from 'history/createHashHistory';

import GettingStarted from './components/app/GettingStarted';
import AppOverview from './components/app/AppOverview';
import ErrorGroupDetails from './components/app/ErrorGroupDetails';
import ErrorGroupOverview from './components/app/ErrorGroupOverview';
import Main from './components/app/Main';
import TransactionDetails from './components/app/TransactionDetails';
import TransactionOverview from './components/app/TransactionOverview';

import configureStore from './store/config/configureStore';
import connectTimeFilterToStore from './utils/timepicker/connectToStore';
import connectHistoryToStore from './utils/connectHistoryToStore';

const store = configureStore();
const history = createHistory();

function Root({ timefilter }) {
  connectTimeFilterToStore(timefilter, store.dispatch);
  connectHistoryToStore(history, store.dispatch);

  return (
    <Provider store={store}>
      <Router history={history}>
        <Main>
          {/* App */}
          <Route exact path="/" component={AppOverview} />

          {/* Errors */}
          <Route
            path="/:appName/errors/:groupId"
            component={ErrorGroupDetails}
          />
          <Route exact path="/:appName/errors" component={ErrorGroupOverview} />

          <Switch>
            {/* Getting started */}
            <Route path="/getting-started" component={GettingStarted} />

            {/* Transactions */}
            <Route
              exact
              path="/:appName"
              render={({ location, match }) => {
                const appName = match.params.appName;
                const newPath = `/${appName}/transactions${location.search}`;
                return <Redirect to={newPath} />;
              }}
            />
          </Switch>

          <Route
            exact
            path="/:appName/transactions"
            component={TransactionOverview}
          />

          <Route
            exact
            path="/:appName/transactions/:transactionType"
            component={TransactionOverview}
          />
          <Route
            path="/:appName/transactions/:transactionType/:transactionName"
            component={TransactionDetails}
          />
        </Main>
      </Router>
    </Provider>
  );
}

export default Root;
