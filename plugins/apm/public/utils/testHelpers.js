/* global jest */

import { mount } from 'enzyme';
import moment from 'moment';
import { createMockStore } from 'redux-test-utils';
import createHistory from 'history/createHashHistory';
import PropTypes from 'prop-types';
import enzymeToJson from 'enzyme-to-json';
import 'jest-styled-components';

export function toJson(wrapper) {
  return enzymeToJson(wrapper, {
    noKey: true,
    mode: 'deep'
  });
}

const defaultRoute = {
  match: { path: '/', url: '/', params: {}, isExact: true },
  location: { pathname: '/', search: '', hash: '', key: '4yyjf5' }
};

export function mountWithRouterAndStore(
  Component,
  storeState = {},
  route = defaultRoute
) {
  const store = createMockStore(storeState);
  const history = createHistory();

  const options = {
    context: {
      store,
      router: {
        history,
        route
      }
    },
    childContextTypes: {
      store: PropTypes.object.isRequired,
      router: PropTypes.object.isRequired
    }
  };

  return mount(Component, options);
}

export function mockMoment() {
  // avoid timezone issues
  jest.spyOn(moment.prototype, 'format').mockImplementation(function() {
    return this.unix();
  });

  // convert relative time to absolute time to avoid timing issues
  jest.spyOn(moment.prototype, 'fromNow').mockImplementation(function() {
    return this.unix();
  });
}
