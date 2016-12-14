/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2016 Elasticsearch BV. All Rights Reserved.
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

import _ from 'lodash';
import './styles/main.less';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlMessageBarService', function ($http, $q) {
  const MSG_STYLE = {INFO: 'prl-message-info', WARNING: 'prl-message-warning', ERROR: 'prl-message-error'};

  this.messages = [];

  this.addMessage = function (msg) {
    if (!_.findWhere(this.messages, msg)) {
      this.messages.push(msg);
    }
  };

  this.removeMessage = function (index) {
    this.messages.splice(index, 1);
  };

  this.clear = function () {
    this.messages.length = 0;
  };

  this.info = function (text) {
    this.addMessage({text: text, style: MSG_STYLE.INFO});
  };

  this.warning = function (text) {
    this.addMessage({text: text, style: MSG_STYLE.WARNING});
  };

  this.error = function (text) {
    this.addMessage({text: text, style: MSG_STYLE.ERROR});
  };

})

.controller('PrlMessageBarController', function ($scope, prlMessageBarService) {
  $scope.messages = prlMessageBarService.messages;
  $scope.removeMessage = prlMessageBarService.removeMessage;
})

.directive('prlMessageBar', function (prlMessageBarService) {
  return {
    restrict: 'AE',
    template: require('plugins/prelert/messagebar/messagebar.html')
  };

});

