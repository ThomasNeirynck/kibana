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

/*
 * Angular directive for rendering a list of the top influencer field values for a
 * particular influencer field name, as used in the tooltip for the 'by influencer'
 * swimlane of the Summary dashboard.
 */
import _ from 'lodash';
import $ from 'jquery';
import anomalyUtils from 'plugins/prelert/util/anomaly_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlSwimlaneInfluencers', function ($timeout, prlResultsService) {

  function link(scope, $element, $attrs) {
    scope.indexPattern = scope.$parent.indexPattern;
    scope.influencerFieldName = scope.$parent.influencerFieldName;
    scope.selectedJobIds = scope.$parent.selectedJobIds;
    scope.earliestMs = scope.$parent.earliestMs;
    scope.latestMs = scope.$parent.latestMs;
    scope.itemPageY = scope.$parent.itemPageY;
    scope.loadedInfluencers = false;

    // Set up an Angular timeout to query Elasticsearch for the top influencers
    // after the delay has passed. This will be cancelled if the scope is destroyed
    // before the delay has passed, for example when the mouse quickly sweeps over a
    // number of points in the swimlane.
    const timer = $timeout(function () {}, 750);
    timer.then(
      function () {
        getTopInfluencersData();
      },
      function () {
        // Timer cancelled - don't request influencers data.
      }
    );

    // Call results service to get top 5 influencer field values.
    function getTopInfluencersData() {
      prlResultsService.getTopInfluencerValues(
          scope.indexPattern.id, scope.selectedJobIds, scope.influencerFieldName, scope.earliestMs, scope.latestMs, 5)
      .then(function (resp) {
        scope.loadedInfluencers = true;

        if (resp.results.length > 0) {
          // Re-position the tooltip so increased vertical height is visible on screen.
          const $win = $(window);
          const winHeight = $win.height();
          const yOffset = window.pageYOffset;
          const height = $('.prl-swimlane-tooltip').outerHeight(true) + (resp.results.length * 37);
          const itemY = scope.itemPageY;
          $('.prl-swimlane-tooltip').css('top', itemY + height < winHeight + yOffset ? itemY : itemY - height);
        }

        scope.influencers = _.map(resp.results, function (result) {
          const score = parseInt(result.maxAnomalyScore);
          const bandScore = score !== 0 ? score : 1;
          const displayScore = score !== 0 ? score : '< 1';
          const severity = anomalyUtils.getSeverity(score);
          const influencer = {'influencerFieldValue': result.influencerFieldValue,
            'bandScore': score > 3 ? score : 3,  // Gives the band some visible width for low scores.
            'score': score,
            'severity': severity
          };
          return influencer;
        });

      }).catch(function (resp) {
        scope.loadedInfluencers = true;
        console.log('prlSwimlaneInfluencers directive - error getting top influencer field values info from ES:', resp);
      });
    }

    // If the scope is destroyed, cancel the timer so that we don't request
    // the top influencer data for a tooltip that is no longer showing.
    scope.$on('$destroy', function (event) {
      $timeout.cancel(timer);
    });
  }

  return {
    restrict: 'AE',
    replace: false,
    scope: {},
    template: require('plugins/prelert/swimlane/swimlane_influencers/swimlane_influencers.html'),
    link: link
  };
});
