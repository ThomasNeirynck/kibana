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

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlValidateJobModal', function ($scope, $modalInstance, params) {

  $scope.ui = {
    jobId: params.job.job_id,
    success: params.resp.success,
    messages: params.resp.messages.map(message => {
      message.health = message.status;
      if (message.health === 'error') {
        message.health = 'danger';
      }
      return message;
    })
  };

  // close modal and return to jobs list
  $scope.close = function () {
    $modalInstance.close();
  };

});
