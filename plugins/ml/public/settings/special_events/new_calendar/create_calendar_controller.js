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

import $ from   'jquery';

import 'plugins/ml/settings/special_events/components/item_select';
import 'plugins/ml/settings/special_events/components/events_list';

import uiRoutes from 'ui/routes';
import { checkLicense } from 'plugins/ml/license/check_license';
import { checkGetJobsPrivilege } from 'plugins/ml/privilege/check_privilege';

import template from './create_calendar.html';

uiRoutes
  .when('/settings/calendars_list/new_calendar', {
    template,
    resolve: {
      CheckLicense: checkLicense,
      privileges: checkGetJobsPrivilege
    }
  })
  .when('/settings/calendars_list/edit_calendar/:calendarId', {
    template,
    resolve: {
      CheckLicense: checkLicense,
      privileges: checkGetJobsPrivilege
    }
  });

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml', ['ui.bootstrap']);

module.controller('MlCreateCalendar',
  function (
    $scope,
    $route,
    $location,
    ml,
    timefilter,
    mlJobService) {

    const calendarId = $route.current.params.calendarId;
    $scope.isNewCalendar = (calendarId === undefined);

    $scope.pageTitle = $scope.isNewCalendar ? 'Create new calendar' : `Edit calendar ${calendarId}`;

    $scope.calendarId = calendarId || '';
    $scope.events = [];
    $scope.jobIds = [];
    $scope.allJobs = [];
    $scope.groupIds = [];
    $scope.allGroups = [];
    $scope.updateJobsList = {};
    $scope.updateGroupsList = {};

    mlJobService.loadJobs()
      .then(() => {
        $scope.allJobs = mlJobService.jobs.map(j => ({ id: j.job_id }));
        $scope.allGroups = mlJobService.getJobGroups().map(g => ({ id: g.id }));

        if (calendarId !== undefined) {
          ml.calendars({ calendarId })
            .then((calendar) => {
              $scope.events = calendar.events || [];

              calendar.job_ids.forEach(id => {
                if ($scope.allJobs.find((j) => j.id === id)) {
                  $scope.jobIds.push(id);
                } else if ($scope.allGroups.find((g) => g.id === id)) {
                  $scope.groupIds.push(id);
                }
              });
              $scope.updateJobsList.update($scope.jobIds);
              $scope.updateGroupsList.update($scope.groupIds);
            });
        }
        $('.new-calendar-container #id').focus();
      });

    $scope.save = function () {
      const calendar = {
        calendarId: $scope.calendarId,
        events: $scope.events,
        job_ids: [...$scope.jobIds, ...$scope.groupIds],
      };

      const saveFunc = $scope.isNewCalendar ? ml.addCalendar : ml.updateCalendar;
      saveFunc(calendar)
        .then(() => {
          $location.path('settings/calendars_list');
        })
        .catch((error) => {
          console.log(error);
        });
    };

    $scope.cancel = function () {
      $location.path('settings/calendars_list');
    };

    $scope.saveEnabled = function () {
      return ($scope.calendarId !== '' && $scope.calendarId !== undefined);
    };

  });
