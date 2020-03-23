/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { createAction } from 'redux-actions';
import { DynamicSettings } from '../../../common/runtime_types';

export const getDynamicSettings = createAction<{}>('GET_DYNAMIC_SETTINGS');
export const getDynamicSettingsSuccess = createAction<DynamicSettings>(
  'GET_DYNAMIC_SETTINGS_SUCCESS'
);
export const getDynamicSettingsFail = createAction<Error>('GET_DYNAMIC_SETTINGS_FAIL');

export const setDynamicSettings = createAction<DynamicSettings>('SET_DYNAMIC_SETTINGS');
export const setDynamicSettingsSuccess = createAction<DynamicSettings>(
  'SET_DYNAMIC_SETTINGS_SUCCESS'
);
export const setDynamicSettingsFail = createAction<Error>('SET_DYNAMIC_SETTINGS_FAIL');
export const acknowledgeSetDynamicSettings = createAction<{}>('ACKNOWLEDGE_SET_DYNAMIC_SETTINGS');
