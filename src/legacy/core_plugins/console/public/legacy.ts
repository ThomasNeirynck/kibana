/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { npSetup, npStart } from 'ui/new_platform';
import { I18nContext } from 'ui/i18n';
import chrome from 'ui/chrome';
import { FeatureCatalogueCategory } from 'ui/registry/feature_catalogue';

import { plugin } from './np_ready';
import { DevToolsSetup } from '../../../../plugins/dev_tools/public';
import { HomePublicPluginSetup } from '../../../../plugins/home/public';
import { UsageCollectionSetup } from '../../../../plugins/usage_collection/public';

export interface XPluginSet {
  usageCollection: UsageCollectionSetup;
  dev_tools: DevToolsSetup;
  home: HomePublicPluginSetup;
  __LEGACY: {
    I18nContext: any;
    elasticsearchUrl: string;
    category: FeatureCatalogueCategory;
  };
}

const pluginInstance = plugin({} as any);

(async () => {
  await pluginInstance.setup(npSetup.core, {
    ...npSetup.plugins,
    __LEGACY: {
      elasticsearchUrl: chrome.getInjected('elasticsearchUrl'),
      I18nContext,
      category: FeatureCatalogueCategory.ADMIN,
    },
  });
  await pluginInstance.start(npStart.core);
})();
