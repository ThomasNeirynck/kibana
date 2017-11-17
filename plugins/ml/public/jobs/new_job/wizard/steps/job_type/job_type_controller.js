/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

/*
 * Controller for the second step in the Create Job wizard, allowing
 * the user to select the type of job they wish to create.
 */

import uiRoutes from 'ui/routes';
import { checkLicenseExpired } from 'plugins/ml/license/check_license';
import { checkCreateJobsPrivilege } from 'plugins/ml/privilege/check_privilege';
import { createSearchItems } from 'plugins/ml/jobs/new_job/utils/new_job_utils';
import template from './job_type.html';

uiRoutes
.when('/jobs/new_job/step/job_type', {
  template,
  resolve: {
    CheckLicense: checkLicenseExpired,
    privileges: checkCreateJobsPrivilege,
    indexPattern: (courier, $route) => courier.indexPatterns.get($route.current.params.index),
    savedSearch: (courier, $route, savedSearches) => savedSearches.get($route.current.params.savedSearchId)
  }
});


import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlNewJobStepJobType',
function (
  $scope,
  $route,
  timefilter) {

  timefilter.enabled = false; // remove time picker from top of page

  const {
    indexPattern,
    savedSearch } = createSearchItems($route);

  $scope.pageTitleLabel = (savedSearch.id !== undefined) ?
    `saved search ${savedSearch.title}` : `index pattern ${indexPattern.title}`;

  $scope.getCreateSimpleJobUrl = function (basePath) {
    return (savedSearch.id === undefined) ? `${basePath}/create?index=${indexPattern.id}` :
        `${basePath}/create?savedSearchId=${savedSearch.id}`;
  };

  $scope.getCreateAdvancedJobUrl = function (basePath) {
    return (savedSearch.id === undefined) ? `${basePath}?index=${indexPattern.id}` :
        `${basePath}?savedSearchId=${savedSearch.id}`;
  };

  $scope.getDataRecognizerUrl = function (basePath) {
    return (savedSearch.id === undefined) ? `${basePath}&index=${indexPattern.id}` :
        `${basePath}?savedSearchId=${savedSearch.id}`;
  };

  $scope.getDataVisualizerUrl = function (basePath) {
    return (savedSearch.id === undefined) ? `${basePath}?index=${indexPattern.id}` :
        `${basePath}?savedSearchId=${savedSearch.id}`;
  };

});
