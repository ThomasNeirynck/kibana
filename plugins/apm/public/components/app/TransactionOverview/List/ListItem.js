import React from 'react';
import styled from 'styled-components';

import { KuiTableRow, KuiTableRowCell } from 'ui_framework/components';
import {
  unit,
  units,
  borderRadius,
  px,
  colors,
  fontFamilyCode
} from '../../../../style/variables';
import { RelativeLink, legacyEncodeURIComponent } from '../../../../utils/url';

import { get } from 'lodash';
import { TRANSACTION_NAME } from '../../../../../common/constants';
import { asMillisWithDefault, asRpm } from '../../../../utils/formatters';

const TransactionNameCell = styled(KuiTableRowCell)`
  font-family: ${fontFamilyCode};
  max-width: ${px(unit * 4)};
`;

const ImpactBarBackground = styled.div`
  height: ${px(units.minus)};
  border-radius: ${borderRadius};
  background: ${colors.gray4};
`;

const ImpactBar = styled.div`
  height: ${px(units.minus)};
  background: ${colors.blue1};
  border-radius: ${borderRadius};
`;

function ImpactSparkline({ impact }) {
  if (!impact && impact !== 0) {
    return <div>N/A</div>;
  }

  return (
    <ImpactBarBackground>
      <ImpactBar style={{ width: `${impact}%` }} />
    </ImpactBarBackground>
  );
}

function TransactionListItem({ appName, transaction, type, impact }) {
  const transactionName = get({ transaction }, TRANSACTION_NAME);
  const transactionUrl = `${appName}/transactions/${encodeURIComponent(
    type
  )}/${legacyEncodeURIComponent(transactionName)}`;

  return (
    <KuiTableRow>
      <TransactionNameCell>
        <RelativeLink path={transactionUrl}>
          {transactionName || 'N/A'}
        </RelativeLink>
      </TransactionNameCell>
      <KuiTableRowCell>{asMillisWithDefault(transaction.avg)}</KuiTableRowCell>
      <KuiTableRowCell>{asMillisWithDefault(transaction.p95)}</KuiTableRowCell>
      <KuiTableRowCell>{asRpm(transaction.rpm)}</KuiTableRowCell>
      <KuiTableRowCell>
        <ImpactSparkline impact={impact} />
      </KuiTableRowCell>
    </KuiTableRow>
  );
}

export default TransactionListItem;
