/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { ApplicationStart, IUiSettingsClient } from '../../../core/public';
import { createGetterSetter } from '../../../plugins/kibana_utils/public';
import { IndexPatternsContract, DataPublicPluginStart } from '../../../plugins/data/public';
import { SharePluginStart } from '../../../plugins/share/public';

export const [getUISettings, setUISettings] = createGetterSetter<IUiSettingsClient>('UISettings');

export const [getApplication, setApplication] = createGetterSetter<ApplicationStart>('Application');

export const [getShareService, setShareService] = createGetterSetter<SharePluginStart>('Share');

export const [getIndexPatterns, setIndexPatterns] = createGetterSetter<IndexPatternsContract>(
  'IndexPatterns'
);

export const [getQueryService, setQueryService] = createGetterSetter<
  DataPublicPluginStart['query']
>('Query');
