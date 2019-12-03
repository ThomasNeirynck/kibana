/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { TransactionMetadata } from '..';
import { render } from '@testing-library/react';
import { Transaction } from '../../../../../../typings/es_schemas/ui/Transaction';
import {
  expectTextsInDocument,
  expectTextsNotInDocument,
  MockPluginContextWrapper
} from '../../../../../utils/testHelpers';

const renderOptions = {
  wrapper: MockPluginContextWrapper
};

function getTransaction() {
  return ({
    labels: { someKey: 'labels value' },
    http: { someKey: 'http value' },
    host: { someKey: 'host value' },
    container: { someKey: 'container value' },
    service: { someKey: 'service value' },
    process: { someKey: 'process value' },
    agent: { someKey: 'agent value' },
    url: { someKey: 'url value' },
    user: { someKey: 'user value' },
    notIncluded: 'not included value',
    transaction: {
      id: '7efbc7056b746fcb',
      notIncluded: 'transaction not included value',
      custom: {
        someKey: 'custom value'
      }
    }
  } as unknown) as Transaction;
}

describe('TransactionMetadata', () => {
  it('should render a transaction with all sections', () => {
    const transaction = getTransaction();
    const output = render(
      <TransactionMetadata transaction={transaction} />,
      renderOptions
    );

    // sections
    expectTextsInDocument(output, [
      'Labels',
      'HTTP',
      'Host',
      'Container',
      'Service',
      'Process',
      'Agent',
      'URL',
      'User',
      'Custom'
    ]);
  });

  it('should render a transaction with all included dot notation keys', () => {
    const transaction = getTransaction();
    const output = render(
      <TransactionMetadata transaction={transaction} />,
      renderOptions
    );

    // included keys
    expectTextsInDocument(output, [
      'labels.someKey',
      'http.someKey',
      'host.someKey',
      'container.someKey',
      'service.someKey',
      'process.someKey',
      'agent.someKey',
      'url.someKey',
      'user.someKey',
      'transaction.custom.someKey'
    ]);

    // excluded keys
    expectTextsNotInDocument(output, [
      'notIncluded',
      'transaction.notIncluded'
    ]);
  });

  it('should render a transaction with all included values', () => {
    const transaction = getTransaction();
    const output = render(
      <TransactionMetadata transaction={transaction} />,
      renderOptions
    );

    // included values
    expectTextsInDocument(output, [
      'labels value',
      'http value',
      'host value',
      'container value',
      'service value',
      'process value',
      'agent value',
      'url value',
      'user value',
      'custom value'
    ]);

    // excluded values
    expectTextsNotInDocument(output, [
      'not included value',
      'transaction not included value'
    ]);
  });

  it('should render a transaction with only the required sections', () => {
    const transaction = {} as Transaction;
    const output = render(
      <TransactionMetadata transaction={transaction} />,
      renderOptions
    );

    // required sections should be found
    expectTextsInDocument(output, ['Labels', 'User']);

    // optional sections should NOT be found
    expectTextsNotInDocument(output, [
      'HTTP',
      'Host',
      'Container',
      'Service',
      'Process',
      'Agent',
      'URL',
      'Custom'
    ]);
  });
});
