import _ from 'lodash';
import * as rest from '../services/rest';
import { STATUS } from '../constants';

// ACTION TYPES
export const DISTRIBUTION_LOADING = 'DISTRIBUTION_LOADING';
export const DISTRIBUTION_SUCCESS = 'DISTRIBUTION_SUCCESS';
export const DISTRIBUTION_FAILURE = 'DISTRIBUTION_FAILURE';

const INITIAL_STATE = { data: [] };
function distribution(state = INITIAL_STATE, action) {
  switch (action.type) {
    case DISTRIBUTION_LOADING:
      return { ...INITIAL_STATE, status: STATUS.LOADING };

    case DISTRIBUTION_SUCCESS: {
      return { data: action.response, status: STATUS.SUCCESS };
    }

    case DISTRIBUTION_FAILURE:
      return {
        ...INITIAL_STATE,
        error: action.error,
        status: STATUS.FAILURE
      };
    default:
      return state;
  }
}

const distributions = (state = {}, action) => {
  switch (action.type) {
    case DISTRIBUTION_LOADING:
    case DISTRIBUTION_SUCCESS:
    case DISTRIBUTION_FAILURE:
      return {
        ...state,
        [action.key]: distribution(state[action.key], action)
      };
    default:
      return state;
  }
};

export function loadDistribution({ appName, start, end, transactionName }) {
  return async dispatch => {
    const key = `${appName}_${start}_${end}_${transactionName}`;
    dispatch({ type: DISTRIBUTION_LOADING, key });

    try {
      const response = await rest.loadDistribution({
        appName,
        start,
        end,
        transactionName
      });
      return dispatch({
        response,
        key,
        type: DISTRIBUTION_SUCCESS
      });
    } catch (error) {
      return dispatch({
        error: error.error,
        key,
        type: DISTRIBUTION_FAILURE
      });
    }
  };
}

export function getDistribution(state) {
  const { appName, start, end, transactionName } = state.urlParams;
  const key = `${appName}_${start}_${end}_${transactionName}`;
  return state.distributions[key] || INITIAL_STATE;
}

export function getDefaultBucketIndex(state) {
  const _distribution = getDistribution(state);
  return _distribution.data.defaultBucketIndex;
}

export function getDefaultTransactionId(state) {
  const _distribution = getDistribution(state);
  const bucketIndex =
    state.urlParams.bucket !== undefined
      ? state.urlParams.bucket
      : _distribution.data.defaultBucketIndex;
  return _.get(_distribution, `data.buckets['${bucketIndex}'].transactionId`);
}

export default distributions;
