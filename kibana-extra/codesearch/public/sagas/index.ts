/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { fork } from 'redux-saga/effects';

import { watchDocumentSearch } from './document_search';
import { watchLspMethods } from './editor';
import { watchFetchBranchesAndCommits, watchFetchRepoTree } from './file';
import { watchDeleteRepo, watchFetchRepos, watchImportRepo, watchIndexRepo } from './repository';
import { watchLocationChange } from './route';
import { watchLoadStructure } from './structure';
import { watchSymbolSearchQueryChanged } from './symbol_search';

export function* rootSaga() {
  yield fork(watchFetchRepos);
  yield fork(watchLocationChange);
  yield fork(watchDeleteRepo);
  yield fork(watchIndexRepo);
  yield fork(watchImportRepo);
  yield fork(watchFetchRepoTree);
  yield fork(watchFetchBranchesAndCommits);
  yield fork(watchSymbolSearchQueryChanged);
  yield fork(watchDocumentSearch);
  yield fork(watchLoadStructure);
  yield fork(watchLspMethods);
}
