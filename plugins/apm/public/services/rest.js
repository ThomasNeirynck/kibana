import 'isomorphic-fetch';
import { camelizeKeys } from 'humps';
import url from 'url';
import _ from 'lodash';

async function callApi(options) {
  const { pathname, query, camelcase, ...urlOptions } = {
    camelcase: true,
    credentials: 'same-origin',
    method: 'GET',
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    ...options
  };

  const fullUrl = url.format({
    pathname,
    query
  });

  try {
    const response = await fetch(fullUrl, urlOptions);
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json);
    }
    return camelcase ? camelizeKeys(json) : json;
  } catch (err) {
    console.error('Rest request error', options, err);
    throw err;
  }
}

function getAppRootPath(appName) {
  return `../api/apm/apps/${appName}`;
}

export async function loadAppList({ start, end, query }) {
  return callApi({
    pathname: `../api/apm/apps`,
    query: {
      start,
      end,
      query
    }
  });
}

export async function loadApp({ start, end, appName }) {
  const apps = await loadAppList({ start, end, query: appName });
  return _.first(apps);
}

export async function loadTransactionList({
  appName,
  start,
  end,
  transactionType
}) {
  return callApi({
    pathname: `${getAppRootPath(appName)}/metrics/transactions`,
    query: {
      start,
      end,
      transaction_type: transactionType
    }
  });
}

export async function loadDistribution({
  appName,
  start,
  end,
  transactionName
}) {
  return callApi({
    pathname: `${getAppRootPath(appName)}/metrics/distribution`,
    query: {
      start,
      end,
      transaction_name: transactionName
    }
  });
}

export async function loadTraces({ appName, start, end, transactionId }) {
  return callApi({
    pathname: `${getAppRootPath(appName)}/metrics/traces`,
    query: {
      start,
      end,
      transaction_id: transactionId
    }
  });
}

export async function loadTransaction({ appName, start, end, transactionId }) {
  return callApi({
    camelcase: false,
    pathname: `${getAppRootPath(
      appName
    )}/metrics/transactions/${transactionId}`,
    query: {
      start,
      end
    }
  });
}

export async function loadCharts({
  appName,
  start,
  end,
  transactionType,
  transactionName
}) {
  return callApi({
    pathname: `${getAppRootPath(appName)}/metrics/charts`,
    query: {
      start,
      end,
      transaction_type: transactionType,
      transaction_name: transactionName
    }
  });
}
