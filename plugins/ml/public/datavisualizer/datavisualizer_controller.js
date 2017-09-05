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
  * Angular controller for the Machine Learning data visualizer which allows the user
  * to explpre the data in the fields in an index pattern prior to creating a job.
  */

import _ from 'lodash';
import 'ui/courier';

import 'plugins/kibana/visualize/styles/main.less';

import chrome from 'ui/chrome';
import uiRoutes from 'ui/routes';
import { DATA_VISUALIZER_FIELD_TYPES, KBN_FIELD_TYPES } from 'plugins/ml/constants/field_types';
import { checkLicense } from 'plugins/ml/license/check_license';

uiRoutes
.when('/datavisualizer/view', {
  template: require('./datavisualizer.html'),
  resolve: {
    CheckLicense: checkLicense,
    indexPattern: (courier, $route) => courier.indexPatterns.get($route.current.params.index)
  }
});

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module
.controller('MlDataVisualizerViewFields', function (
  $scope,
  $route,
  $timeout,
  timefilter,
  mlDataVisualizerSearchService) {

  timefilter.enabled = true;
  const indexPattern = $route.current.locals.indexPattern;

  $scope.metricConfigurations = [];
  $scope.totalMetricFieldCount = 0;
  $scope.populatedMetricFieldCount = 0;
  $scope.showAllMetrics = false;
  $scope.fieldConfigurations = [];
  $scope.totalNonMetricFieldCount = 0;
  $scope.populatedNonMetricFieldCount = 0;
  $scope.DATA_VISUALIZER_FIELD_TYPES = DATA_VISUALIZER_FIELD_TYPES;
  $scope.showAllFields = false;
  $scope.filterFieldType = '*';
  $scope.urlBasePath = chrome.getBasePath();

  $scope.indexPattern = indexPattern;
  $scope.earliest = timefilter.getActiveBounds().min.valueOf();
  $scope.latest = timefilter.getActiveBounds().max.valueOf();

  $scope.metricFilterIcon = 0;
  $scope.metricFieldFilter = '';
  $scope.fieldFilterIcon = 0;
  $scope.fieldFilter = '';

  let metricFieldRegexp;
  let metricFieldFilterTimeout;
  let fieldRegexp;
  let fieldFilterTimeout;

  // Refresh the data when the time range is altered.
  $scope.$listen(timefilter, 'fetch', function () {
    $scope.earliest = timefilter.getActiveBounds().min.valueOf();
    $scope.latest = timefilter.getActiveBounds().max.valueOf();
    loadOverallStats();
  });

  $scope.toggleAllMetrics = function () {
    $scope.showAllMetrics = !$scope.showAllMetrics;
    createMetricConfigurations();
  };

  $scope.toggleAllFields = function () {
    $scope.showAllFields = !$scope.showAllFields;
    loadNonMetricFieldList();
  };

  $scope.filterFieldTypeChanged = function (fieldType) {
    $scope.filterFieldType = fieldType;
    loadNonMetricFieldList();
  };

  $scope.metricFieldFilterChanged = function () {
    // Clear the previous filter timeout.
    if (metricFieldFilterTimeout !== undefined) {
      $timeout.cancel(metricFieldFilterTimeout);
    }

    // Create a timeout to recreate the metric configurations based on the filter.
    // A timeout of 1.5s is used as the user may still be in the process of typing the filter
    // when this function is first called.
    metricFieldFilterTimeout = $timeout(() => {
      if ($scope.metricFieldFilter && $scope.metricFieldFilter !== '') {
        metricFieldRegexp = new RegExp('(' + $scope.metricFieldFilter + ')', 'gi');
      } else {
        metricFieldRegexp = undefined;
      }

      createMetricConfigurations();
      metricFieldFilterTimeout = undefined;
    }, 1500);

    // Display the spinner icon after 250ms of typing.
    // The spinner is a nice way of showing that something is
    // happening as we're stalling for the user to stop typing.
    $timeout(() => {
      $scope.metricFilterIcon = 1;
    }, 250);

  };

  $scope.clearMetricFilter = function () {
    $scope.metricFieldFilter = '';
    metricFieldRegexp = undefined;
    createMetricConfigurations();
  };

  $scope.fieldFilterChanged = function () {
    // Clear the previous filter timeout.
    if (fieldFilterTimeout !== undefined) {
      $timeout.cancel(fieldFilterTimeout);
    }

    // Create a timeout to recreate the non-metric field configurations based on the filter.
    // A timeout of 1.5s is used as the user may still be in the process of typing the filter
    // when this function is first called.
    fieldFilterTimeout = $timeout(() => {
      if ($scope.fieldFilter && $scope.fieldFilter !== '') {
        fieldRegexp = new RegExp('(' + $scope.fieldFilter + ')', 'gi');
      } else {
        fieldRegexp = undefined;
      }

      loadNonMetricFieldList();
      fieldFilterTimeout = undefined;
    }, 1500);

    // Display the spinner icon after 250ms of typing.
    // the spinner is a nice way of showing that something is
    // happening as we're stalling for the user to stop trying.
    $timeout(() => {
      $scope.fieldFilterIcon = 1;
    }, 250);
  };

  $scope.clearFieldFilter = function () {
    $scope.fieldFilter = '';
    fieldRegexp = undefined;
    loadNonMetricFieldList();
  };

  function createMetricConfigurations() {
    $scope.metricConfigurations.length = 0;

    // Strip out _score and _version.
    // TODO - shall we omit all these fields?
    const omitFields = ['_version', '_score'];

    const aggregatableExistsFields = $scope.overallStats.aggregatableExistsFields || [];

    let allMetricFields = [];
    if (metricFieldRegexp === undefined) {
      allMetricFields = _.filter(indexPattern.fields, (f) => {
        return (f.type === KBN_FIELD_TYPES.NUMBER && !_.contains(omitFields, f.displayName));
      });
    } else {
      allMetricFields = _.filter(indexPattern.fields, (f) => {
        return (f.type === KBN_FIELD_TYPES.NUMBER &&
          !_.contains(omitFields, f.displayName) &&
          f.displayName.match(metricFieldRegexp));
      });
    }

    const metricExistsFields = _.filter(allMetricFields, (f) => {
      return aggregatableExistsFields.indexOf(f.displayName) > -1;
    });

    const metricConfigs = [];

    // Add a config for 'event rate', identified by no field name.
    metricConfigs.push({
      type: DATA_VISUALIZER_FIELD_TYPES.NUMBER,
      existsInDocs: true
    });

    // Add on 1 for the document count card.
    // TODO - remove the '+1' if document count goes in its own section.
    $scope.totalMetricFieldCount = allMetricFields.length + 1;
    $scope.populatedMetricFieldCount = metricExistsFields.length + 1;
    if ($scope.totalMetricFieldCount === $scope.populatedMetricFieldCount) {
      $scope.showAllMetrics = true;
    }

    const metricFields = $scope.showAllMetrics ? allMetricFields : metricExistsFields;
    //metricFields = metricFields.slice(0, Math.min(metricFields.length, 6));
    _.each(metricFields, (field) => {
      metricConfigs.push({
        fieldName: field.displayName,
        type: DATA_VISUALIZER_FIELD_TYPES.NUMBER,
        existsInDocs: aggregatableExistsFields.indexOf(field.displayName) > -1
      });
    });

    // Clear the filter spinner if it's running.
    $scope.metricFilterIcon = 0;

    $scope.metricConfigurations = metricConfigs;
  }

  function loadNonMetricFieldList() {
    $scope.fieldConfigurations.length = 0;

    // Strip out _source and _type.
    // TODO - shall we omit all these fields?
    const omitFields = ['_source', '_type', '_index', '_id', '_version'];

    let allNonMetricFields = [];
    if ($scope.filterFieldType === '*') {
      allNonMetricFields = _.filter(indexPattern.fields, (f) => {
        return (f.type !== KBN_FIELD_TYPES.NUMBER && !_.contains(omitFields, f.displayName));
      });
    } else {
      if ($scope.filterFieldType === DATA_VISUALIZER_FIELD_TYPES.TEXT ||
            $scope.filterFieldType === DATA_VISUALIZER_FIELD_TYPES.KEYWORD)  {
        const aggregatableCheck = $scope.filterFieldType === DATA_VISUALIZER_FIELD_TYPES.KEYWORD ? true : false;
        allNonMetricFields = _.filter(indexPattern.fields, (f) => {
          return !_.contains(omitFields, f.displayName) &&
            (f.type === KBN_FIELD_TYPES.STRING) &&
            (f.aggregatable === aggregatableCheck);
        });
      } else {
        allNonMetricFields = _.filter(indexPattern.fields, (f) => {
          return (!_.contains(omitFields, f.displayName) && (f.type === $scope.filterFieldType));
        });
      }
    }

    // If a field filter has been entered, perform another filter on the entered regexp.
    if (fieldRegexp !== undefined) {
      allNonMetricFields = _.filter(allNonMetricFields, (f) => {
        return (f.displayName.match(fieldRegexp));
      });
    }

    $scope.totalNonMetricFieldCount = allNonMetricFields.length;

    // Obtain the list of populated non-metric fields.
    // First add the aggregatable fields which appear in documents.
    const nonMetricFields = [];
    const nonMetricExistsFieldNames = [];
    const aggregatableNotExistsFields = $scope.overallStats.aggregatableNotExistsFields || [];
    _.each(allNonMetricFields, (f) => {
      if (f.aggregatable === true && aggregatableNotExistsFields.indexOf(f.displayName) === -1) {
        nonMetricFields.push(f);
        nonMetricExistsFieldNames.push(f.displayName);
      }
    });

    // Secondly, add in non-aggregatable string fields which appear in documents.
    const nonAggFields = _.filter(allNonMetricFields, (f) => {
      return f.aggregatable === false;
    });

    if (nonAggFields.length > 0) {
      let numWaiting = nonAggFields.length;
      _.each(nonAggFields, (field) => {
        mlDataVisualizerSearchService.nonAggregatableFieldExists(indexPattern, field.displayName,
          $scope.earliest, $scope.latest)
        .then((resp) => {
          if (resp.exists) {
            nonMetricFields.push(field);
            nonMetricExistsFieldNames.push(field.displayName);
          }
          numWaiting--;
        }).catch((resp) => {
          console.log(`DataVisualizer - error checking whether field ${field.displayName} exists:`, resp);
          numWaiting--;
        }).then(() => {
          if (numWaiting === 0) {
            $scope.populatedNonMetricFieldCount = nonMetricExistsFieldNames.length;
            if ($scope.showAllFields) {
              createNonMetricFieldConfigurations(allNonMetricFields, nonMetricExistsFieldNames);
            } else {
              createNonMetricFieldConfigurations(nonMetricFields, nonMetricExistsFieldNames);
            }
          }
        });
      });
    } else {
      $scope.populatedNonMetricFieldCount = nonMetricFields.length;
      if ($scope.totalNonMetricFieldCount === $scope.populatedNonMetricFieldCount) {
        $scope.showAllFields = true;
      }
      if ($scope.showAllFields) {
        createNonMetricFieldConfigurations(allNonMetricFields, nonMetricExistsFieldNames);
      } else {
        createNonMetricFieldConfigurations(nonMetricFields, nonMetricExistsFieldNames);
      }
    }

  }

  function createNonMetricFieldConfigurations(nonMetricFields, nonMetricExistsFieldNames) {
    const fieldConfigs = [];

    _.each(nonMetricFields, (field) => {
      const config = {
        fieldName: field.displayName,
        aggregatable: field.aggregatable,
        scripted: field.scripted,
        existsInDocs: nonMetricExistsFieldNames.indexOf(field.displayName) > -1
      };

      // Map the field type from the Kibana index pattern to the field type
      // used in the data visualizer.
      switch (field.type) {
        case KBN_FIELD_TYPES.DATE:
          config.type = DATA_VISUALIZER_FIELD_TYPES.DATE;
          break;
        case KBN_FIELD_TYPES.IP:
          config.type = DATA_VISUALIZER_FIELD_TYPES.IP;
          break;
        case KBN_FIELD_TYPES.STRING:
          config.type = field.aggregatable ? DATA_VISUALIZER_FIELD_TYPES.KEYWORD : DATA_VISUALIZER_FIELD_TYPES.TEXT;
          break;
        case KBN_FIELD_TYPES.BOOLEAN:
          config.type = DATA_VISUALIZER_FIELD_TYPES.BOOLEAN;
          break;
        case KBN_FIELD_TYPES.GEO_POINT:
          config.type = DATA_VISUALIZER_FIELD_TYPES.GEO_POINT;
          break;
        default:
          // Add a flag to indicate that this is one of the 'other' Kibana
          // field types that do not yet have a specific card type.
          config.type = field.type;
          config.isUnsupportedType = true;
          break;
      }

      fieldConfigs.push(config);
    });

    // Clear the filter spinner if it's running.
    $scope.fieldFilterIcon = 0;

    $scope.fieldConfigurations = _.sortBy(fieldConfigs, 'fieldName');
  }


  function loadOverallStats() {
    mlDataVisualizerSearchService.getOverallStats(indexPattern, $scope.earliest, $scope.latest)
    .then((resp) => {
      $scope.overallStats = resp.stats;
      createMetricConfigurations();
      loadNonMetricFieldList();
    }).catch((resp) => {
      console.log('DataVisualizer - error getting overall stats from elasticsearch:', resp);
    });
  }

  loadOverallStats();

});
