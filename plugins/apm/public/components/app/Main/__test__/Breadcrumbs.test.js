import React from 'react';
import { mount } from 'enzyme';
import { MemoryRouter } from 'react-router';
jest.mock('../../../../utils/timepicker', () => {});

import Breadcrumbs from '../Breadcrumbs';
import { toJson } from '../../../../utils/testHelpers';

function expectBreadcrumbToMatchSnapshot(route) {
  const wrapper = mount(
    <MemoryRouter initialEntries={[`${route}?_g=`]}>
      <Breadcrumbs />
    </MemoryRouter>
  );
  expect(
    toJson(wrapper.find('.kuiLocalBreadcrumb').children())
  ).toMatchSnapshot();
}

describe('Breadcrumbs', () => {
  it('Homepage', () => {
    expectBreadcrumbToMatchSnapshot('/');
  });

  it('/:serviceName/errors/:groupId', () => {
    expectBreadcrumbToMatchSnapshot('/opbeans-node/errors/myGroupId');
  });

  it('/:serviceName/errors', () => {
    expectBreadcrumbToMatchSnapshot('/opbeans-node/errors');
  });

  it('/:serviceName', () => {
    expectBreadcrumbToMatchSnapshot('/opbeans-node');
  });

  it('/:serviceName/transactions', () => {
    expectBreadcrumbToMatchSnapshot('/opbeans-node/transactions');
  });

  it('/:serviceName/transactions/:transactionType', () => {
    expectBreadcrumbToMatchSnapshot('/opbeans-node/transactions/request');
  });

  it('/:serviceName/transactions/:transactionType/:transactionName', () => {
    expectBreadcrumbToMatchSnapshot(
      '/:serviceName/transactions/request/my-transaction-name'
    );
  });
});
