/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { useShouldUseMobileLayout } from './use_should_use_mobile_layout';

/**
 * The height for a table on the overview page. Is the height of a 5-row basic
 * table.
 */
const tableHeight = 282;

/**
 * A container for the table. Sets height and flex properties on the EUI Basic
 * Table contained within and the first child div of that. This makes it so the
 * pagination controls always stay fixed at the bottom in the same position.
 *
 * Only do this when we're at a non-mobile breakpoint.
 *
 * Hide the empty message when we don't yet have any items and are still loading.
 */
const ServiceOverviewTableContainerDiv = styled.div<{
  isEmptyAndLoading: boolean;
  shouldUseMobileLayout: boolean;
}>`
  ${({ shouldUseMobileLayout }) =>
    shouldUseMobileLayout
      ? ''
      : `
  height: ${tableHeight}px;
  display: flex;
  flex-direction: column;

  .euiBasicTable {
    display: flex;
    flex-direction: column;
    flex-grow: 1;

    > :first-child {
      flex-grow: 1;
    }
  `}

  .euiTableRowCell {
    visibility: ${({ isEmptyAndLoading }) =>
      isEmptyAndLoading ? 'hidden' : 'visible'};
  }
`;

export function ServiceOverviewTableContainer({
  children,
  isEmptyAndLoading,
}: {
  children?: ReactNode;
  isEmptyAndLoading: boolean;
}) {
  const shouldUseMobileLayout = useShouldUseMobileLayout();

  return (
    <ServiceOverviewTableContainerDiv
      isEmptyAndLoading={isEmptyAndLoading}
      shouldUseMobileLayout={shouldUseMobileLayout}
    >
      {children}
    </ServiceOverviewTableContainerDiv>
  );
}
