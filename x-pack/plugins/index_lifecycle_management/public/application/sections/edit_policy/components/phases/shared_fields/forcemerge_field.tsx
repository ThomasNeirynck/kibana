/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import { EuiSpacer, EuiTextColor } from '@elastic/eui';

import { UseField, ToggleField, NumericField } from '../../../../../../shared_imports';

import { i18nTexts } from '../../../i18n_texts';

import { useEditPolicyContext } from '../../../edit_policy_context';

import { LearnMoreLink, DescribedFormRow } from '../../';

interface Props {
  phase: 'hot' | 'warm';
}

export const ForcemergeField: React.FunctionComponent<Props> = ({ phase }) => {
  const { policy } = useEditPolicyContext();

  const initialToggleValue = useMemo<boolean>(() => {
    return policy.phases[phase]?.actions?.forcemerge != null;
  }, [policy, phase]);

  return (
    <DescribedFormRow
      title={
        <h3>
          <FormattedMessage
            id="xpack.indexLifecycleMgmt.editPolicy.forceMerge.enableText"
            defaultMessage="Force merge"
          />
        </h3>
      }
      description={
        <EuiTextColor color="subdued">
          <FormattedMessage
            id="xpack.indexLifecycleMgmt.editPolicy.forceMerge.enableExplanationText"
            defaultMessage="Reduce the number of segments in your shard by merging smaller files and clearing deleted ones."
          />{' '}
          <LearnMoreLink docPath="ilm-forcemerge.html" />
        </EuiTextColor>
      }
      titleSize="xs"
      fullWidth
      switchProps={{
        'aria-label': i18nTexts.editPolicy.forceMergeEnabledFieldLabel,
        'data-test-subj': `${phase}-forceMergeSwitch`,
        'aria-controls': 'forcemergeContent',
        label: i18nTexts.editPolicy.forceMergeEnabledFieldLabel,
        initialValue: initialToggleValue,
      }}
    >
      <EuiSpacer />
      <div id="forcemergeContent" aria-live="polite" role="region">
        <UseField
          key={`phases.${phase}.actions.forcemerge.max_num_segments`}
          path={`phases.${phase}.actions.forcemerge.max_num_segments`}
          component={NumericField}
          componentProps={{
            fullWidth: false,
            euiFieldProps: {
              'data-test-subj': `${phase}-selectedForceMergeSegments`,
              min: 1,
            },
          }}
        />
        <UseField
          key={`_meta.${phase}.bestCompression`}
          path={`_meta.${phase}.bestCompression`}
          component={ToggleField}
          componentProps={{
            hasEmptyLabelSpace: true,
            euiFieldProps: {
              'data-test-subj': `${phase}-bestCompression`,
            },
          }}
        />
      </div>
    </DescribedFormRow>
  );
};
