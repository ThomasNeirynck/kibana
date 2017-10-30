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

import _ from 'lodash';
import 'ui/courier';

import 'plugins/kibana/visualize/styles/main.less';
import { AggTypesIndexProvider } from 'ui/agg_types/index';
import { parseInterval } from 'ui/utils/parse_interval';

import dateMath from '@elastic/datemath';
import moment from 'moment';
import angular from 'angular';

import uiRoutes from 'ui/routes';
import { checkLicense } from 'plugins/ml/license/check_license';
import { checkCreateJobsPrivilege } from 'plugins/ml/privilege/check_privilege';
import { IntervalHelperProvider } from 'plugins/ml/util/ml_time_buckets';
import { filterAggTypes } from 'plugins/ml/jobs/new_job/simple/single_metric/create_job/filter_agg_types';
import { isJobIdValid } from 'plugins/ml/util/job_utils';
import { getQueryFromSavedSearch, getSafeFieldName } from 'plugins/ml/jobs/new_job/simple/components/utils/simple_job_utils';
import { populateAppStateSettings } from 'plugins/ml/jobs/new_job/simple/components/utils/app_state_settings';
import { CHART_STATE, JOB_STATE } from 'plugins/ml/jobs/new_job/simple/components/constants/states';
import { ML_JOB_FIELD_TYPES } from 'plugins/ml/../common/constants/field_types';
import { kbnTypeToMLJobType } from 'plugins/ml/util/field_types_utils';
import template from './create_job.html';

uiRoutes
.when('/jobs/new_job/simple/population/create', {
  template,
  resolve: {
    CheckLicense: checkLicense,
    privileges: checkCreateJobsPrivilege,
    indexPattern: (courier, $route) => courier.indexPatterns.get($route.current.params.index),
    savedSearch: (courier, $route, savedSearches) => savedSearches.get($route.current.params.savedSearchId)
  }
});

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module
.controller('MlCreatePopulationJob', function (
  $scope,
  $route,
  $location,
  $filter,
  $window,
  $timeout,
  $q,
  courier,
  timefilter,
  Private,
  mlJobService,
  mlPopulationJobService,
  mlMessageBarService,
  mlFullTimeRangeSelectorService,
  mlESMappingService,
  AppState) {

  timefilter.enabled = true;
  const msgs = mlMessageBarService;
  const MlTimeBuckets = Private(IntervalHelperProvider);

  const stateDefaults = {
    mlJobSettings: {}
  };
  const appState = new AppState(stateDefaults);

  const aggTypes = Private(AggTypesIndexProvider);
  $scope.courier = courier;

  mlPopulationJobService.clearChartData();
  $scope.chartData = mlPopulationJobService.chartData;

  const PAGE_WIDTH = angular.element('.population-job-container').width();
  const BAR_TARGET = (PAGE_WIDTH > 1600) ? 800 : (PAGE_WIDTH / 2);
  const MAX_BARS = BAR_TARGET + (BAR_TARGET / 100) * 100; // 100% larger that bar target
  const REFRESH_INTERVAL_MS = 100;
  const MAX_BUCKET_DIFF = 3;
  const METRIC_AGG_TYPE = 'metrics';
  const EVENT_RATE_COUNT_FIELD = '__ml_event_rate_count__';
  // $scope.EVENT_RATE_COUNT_FIELD = EVENT_RATE_COUNT_FIELD;

  let refreshCounter = 0;

  $scope.JOB_STATE = JOB_STATE;
  $scope.jobState = $scope.JOB_STATE.NOT_STARTED;

  $scope.CHART_STATE = CHART_STATE;
  $scope.chartStates = {
    eventRate: CHART_STATE.LOADING,
    fields: {}
  };

  // flag to stop all results polling if the user navigates away from this page
  let globalForceStop = false;

  let indexPattern = $route.current.locals.indexPattern;
  const query = {
    query_string: {
      analyze_wildcard: true,
      query: '*'
    }
  };

  let filters = [];
  const savedSearch = $route.current.locals.savedSearch;
  const searchSource = savedSearch.searchSource;

  let pageTitle = `index pattern ${indexPattern.title}`;

  if (indexPattern.id === undefined &&
    savedSearch.id !== undefined) {
    indexPattern = searchSource.get('index');
    const q = searchSource.get('query');
    if(q !== undefined && q.language === 'lucene' && q.query !== '') {
      query.query_string.query = q.query;
    }

    const fs = searchSource.get('filter');
    if(fs.length) {
      filters = fs;
    }

    pageTitle = `saved search ${savedSearch.title}`;
  }
  const combinedQuery = getQueryFromSavedSearch({ query, filters });

  $scope.ui = {
    indexPattern,
    pageTitle,
    showJobInput: true,
    showJobFinished: false,
    dirty: false,
    formValid: false,
    bucketSpanValid: true,
    bucketSpanEstimator: { status: 0, message: '' },
    aggTypeOptions: filterAggTypes(aggTypes.byType[METRIC_AGG_TYPE]),
    fields: [],
    overFields: [],
    splitFields: [],
    timeFields: [],
    splitText: '',
    wizard: {
      step: 0,
      forward: function () {
        wizardStep(1);
      },
      back: function () {
        wizardStep(-1);
      },
    },
    intervals: [{
      title: 'Auto',
      value: 'auto',
    }, {
      title: 'Millisecond',
      value: 'ms'
    }, {
      title: 'Second',
      value: 's'
    }, {
      title: 'Minute',
      value: 'm'
    }, {
      title: 'Hourly',
      value: 'h'
    }, {
      title: 'Daily',
      value: 'd'
    }, {
      title: 'Weekly',
      value: 'w'
    }, {
      title: 'Monthly',
      value: 'M'
    }, {
      title: 'Yearly',
      value: 'y'
    }, {
      title: 'Custom',
      value: 'custom'
    }],
    eventRateChartHeight: 100,
    chartHeight: 150,
    showFieldCharts: false,
    showAdvanced: false,
    validation: {
      checks: {
        jobId: { valid: true },
        groupIds: { valid: true }
      },
    }
  };

  $scope.formConfig = {
    agg: {
      type: undefined
    },
    fields: [],
    bucketSpan: '15m',
    chartInterval: undefined,
    resultsIntervalSeconds: undefined,
    start: 0,
    end: 0,
    overField: undefined,
    timeField: indexPattern.timeFieldName,
    // splitField: undefined,
    influencerFields: [],
    firstSplitFieldName: undefined,
    indexPattern: indexPattern,
    query,
    filters,
    combinedQuery,
    jobId: undefined,
    description: undefined,
    jobGroups: [],
    mappingTypes: [],
    useDedicatedIndex: false
  };

  $scope.formChange = function (refreshCardLayout) {
    $scope.ui.isFormValid();
    $scope.ui.dirty = true;

    $scope.loadVis();
    if (refreshCardLayout) {
      sortSplitCards();
    }
  };

  $scope.overChange = function () {
    $scope.addDefaultFieldsToInfluencerList();
    $scope.formChange();
  };

  $scope.splitChange = function (fieldIndex, splitField) {
    return $q((resolve) => {
      $scope.formConfig.fields[fieldIndex].firstSplitFieldName = undefined;

      if (splitField !== undefined) {
        $scope.formConfig.fields[fieldIndex].splitField =  splitField;

        $scope.addDefaultFieldsToInfluencerList();

        mlPopulationJobService.getSplitFields($scope.formConfig, splitField.name, 10)
        .then((resp) => {
          if (resp.results.values && resp.results.values.length) {
            $scope.formConfig.fields[fieldIndex].firstSplitFieldName = resp.results.values[0];
            $scope.formConfig.fields[fieldIndex].cardLabels = resp.results.values;
          }

          drawCards(fieldIndex, true);
          $scope.formChange();
          resolve();
        });
      } else {
        $scope.formConfig.fields[fieldIndex].splitField = undefined;
        $scope.formConfig.fields[fieldIndex].cardLabels = undefined;
        setFieldsChartStates(CHART_STATE.LOADING);
        $scope.ui.splitText = '';
        destroyCards(fieldIndex);
        $scope.formChange();
        resolve();
      }
    });
  };

  $scope.splitReset = function (fieldIndex) {
    $scope.splitChange(fieldIndex, undefined);
  };

  function wizardStep(step) {
    $scope.ui.wizard.step += step;
  }

  function setTime() {
    $scope.ui.bucketSpanValid = true;
    $scope.formConfig.start = dateMath.parse(timefilter.time.from).valueOf();
    $scope.formConfig.end = dateMath.parse(timefilter.time.to).valueOf();
    $scope.formConfig.format = 'epoch_millis';

    if(parseInterval($scope.formConfig.bucketSpan) === null) {
      $scope.ui.bucketSpanValid = false;
    }

    const bounds = timefilter.getActiveBounds();
    $scope.formConfig.chartInterval = new MlTimeBuckets();
    $scope.formConfig.chartInterval.setBarTarget(BAR_TARGET);
    $scope.formConfig.chartInterval.setMaxBars(MAX_BARS);
    $scope.formConfig.chartInterval.setInterval('auto');
    $scope.formConfig.chartInterval.setBounds(bounds);

    adjustIntervalDisplayed($scope.formConfig.chartInterval);

    $scope.ui.isFormValid();
    $scope.ui.dirty = true;
  }

  // ensure the displayed interval is never smaller than the bucketSpan
  // otherwise the model plot bounds can be drawn in the wrong place.
  // this only really affects small jobs when using sum
  function adjustIntervalDisplayed(interval) {
    let makeTheSame = false;
    const intervalSeconds = interval.getInterval().asSeconds();
    const bucketSpan = parseInterval($scope.formConfig.bucketSpan);

    if (bucketSpan.asSeconds() > intervalSeconds) {
      makeTheSame = true;
    }

    if ($scope.formConfig.agg.type !== undefined) {
      const mlName = $scope.formConfig.agg.type.mlName;
      if (mlName === 'count' ||
        mlName === 'low_count' ||
        mlName === 'high_count' ||
        mlName === 'distinct_count') {
        makeTheSame = true;
      }
    }

    if (makeTheSame) {
      interval.setInterval($scope.formConfig.bucketSpan);
    }
  }

  function initAgg() {
    _.each($scope.ui.aggTypeOptions, (agg) => {
      if (agg.title === 'Mean') {
        $scope.formConfig.agg.type = agg;
      }
    });
  }

  function loadFields() {
    const agg = $scope.formConfig.agg;
    let fields = [];
    let categoryFields = [];
    $scope.ui.fields = [];
    agg.type.params.forEach((param) => {
      if (param.name === 'field') {
        fields = getIndexedFields(param, 'number');
      }
      if (param.name === 'customLabel') {
        categoryFields = getIndexedFields(param, ['string', 'ip']);
      }
    });

    $scope.ui.fields.push({
      id: EVENT_RATE_COUNT_FIELD,
      name: 'event rate',
      tooltip: 'System defined field',
      isCountField: true,
      agg: { type: $scope.ui.aggTypeOptions.find(opt => opt.title === 'Count') },
      splitField: undefined,
      mlType: ML_JOB_FIELD_TYPES.NUMBER,
      firstSplitFieldName: undefined,
      cardLabels: undefined
    });

    _.each(fields, (field, i) => {
      const id = getSafeFieldName(field.displayName, i);
      const f = {
        id,
        name: field.displayName,
        tooltip: field.displayName,
        agg,
        splitField: undefined,
        mlType: field.mlType,
        firstSplitFieldName: undefined,
        cardLabels: undefined
      };
      $scope.ui.fields.push(f);
    });

    _.each(categoryFields, (field) => {
      if (field.displayName !== 'type' &&
          field.displayName !== '_id' &&
          field.displayName !== '_index') {
        $scope.ui.splitFields.push(field);
        $scope.ui.overFields.push(field);
      }
    });
  }

  function getIndexedFields(param, fieldTypes) {
    let fields = _.filter(indexPattern.fields.raw, 'aggregatable');

    if (fieldTypes) {
      fields = $filter('fieldType')(fields, fieldTypes);
      fields = $filter('orderBy')(fields, ['type', 'name']);
      fields = _.filter(fields, (f) => f.displayName !== '_type');
      fields = _.each(fields, (f) => f.mlType = kbnTypeToMLJobType(f));
    }
    return fields;
  }

  $scope.ui.isFormValid = function () {
    if ($scope.formConfig.agg.type === undefined ||
        $scope.formConfig.timeField === undefined ||
        $scope.formConfig.fields.length === 0) {

      $scope.ui.formValid = false;
    } else {
      $scope.ui.formValid = true;
    }
    return $scope.ui.formValid;
  };

  $scope.loadVis = function () {
    const thisLoadTimestamp = Date.now();
    $scope.chartData.lastLoadTimestamp = thisLoadTimestamp;

    setTime();
    $scope.ui.isFormValid();

    $scope.ui.showJobInput = true;
    $scope.ui.showJobFinished = false;

    $scope.ui.dirty = false;

    mlPopulationJobService.clearChartData();

    // $scope.chartStates.eventRate = CHART_STATE.LOADING;
    setFieldsChartStates(CHART_STATE.LOADING);

    if ($scope.formConfig.fields.length) {
      $scope.ui.showFieldCharts = true;
      mlPopulationJobService.getLineChartResults($scope.formConfig, thisLoadTimestamp)
      .then((resp) => {
        loadDocCountData(resp.detectors);
      })
      .catch((resp) => {
        msgs.error(resp.message);
        $scope.formConfig.fields.forEach(field => {
          const id = field.id;
          $scope.chartStates.fields[id] = CHART_STATE.NO_RESULTS;
        });
      });
    } else {
      $scope.ui.showFieldCharts = false;
      loadDocCountData([]);
    }

    function loadDocCountData(dtrs) {
      mlPopulationJobService.loadDocCountData($scope.formConfig)
      .then((resp) => {
        if (thisLoadTimestamp === $scope.chartData.lastLoadTimestamp) {
          _.each(dtrs, (dtr, id) => {
            const state = (dtr.line.length) ? CHART_STATE.LOADED : CHART_STATE.NO_RESULTS;
            $scope.chartStates.fields[id] = state;
          });

          $scope.chartData.lastLoadTimestamp = null;
          mlPopulationJobService.updateChartMargin();
          $scope.$broadcast('render');
          $scope.chartStates.eventRate = (resp.job.bars.length) ? CHART_STATE.LOADED : CHART_STATE.NO_RESULTS;
        }
      })
      .catch((resp) => {
        $scope.chartStates.eventRate = CHART_STATE.NO_RESULTS;
        msgs.error(resp.message);
      });
    }
  };

  function setFieldsChartStates(state) {
    _.each($scope.chartStates.fields, (chart, key) => {
      $scope.chartStates.fields[key] = state;
    });
  }

  function drawCards(fieldIndex, animate = true) {
    const labels = $scope.formConfig.fields[fieldIndex].cardLabels;
    const $frontCard = angular.element(`.population-job-container .detector-container.card-${fieldIndex} .card-front`);
    $frontCard.addClass('card');
    $frontCard.find('.card-title').text(labels[0]);
    const w = $frontCard.width();

    let marginTop = (labels.length > 1) ? 54 : 0;
    $frontCard.css('margin-top', marginTop);

    let backCardTitle = '';
    if (labels.length === 2) {
      // create a dummy label if there are only 2 cards, as the space will be visible
      backCardTitle = $scope.formConfig.fields[Object.keys($scope.formConfig.fields)[0]].agg.type.title;
      backCardTitle += ' ';
      backCardTitle += Object.keys($scope.formConfig.fields)[0];
    }

    angular.element(`.detector-container.card-${fieldIndex} .card-behind`).remove();

    for (let i = 0; i < labels.length; i++) {
      let el = '<div class="card card-behind"><div class="card-title">';
      el += labels[i];
      el += '</div><label>';
      el += backCardTitle;
      el += '</label></div>';

      const $backCard = angular.element(el);
      $backCard.css('width', w);
      $backCard.css('height', 100);
      $backCard.css('display', 'auto');
      $backCard.css('z-index', (9 - i));

      $backCard.insertBefore($frontCard);
    }

    const cardsBehind = angular.element(`.detector-container.card-${fieldIndex} .card-behind`);
    let marginLeft = 0;
    let backWidth = w;

    for (let i = 0; i < cardsBehind.length; i++) {
      cardsBehind[i].style.marginTop = marginTop + 'px';
      cardsBehind[i].style.marginLeft = marginLeft + 'px';
      cardsBehind[i].style.width = backWidth + 'px';

      marginTop -= (10 - (i * (10 / labels.length))) * (10 / labels.length);
      marginLeft += (5 - (i / 2));
      backWidth -= (5 - (i / 2)) * 2;
    }
    let i = 0;
    let then = window.performance.now();
    const fps = 20;
    const fpsInterval = 1000 / fps;

    function fadeCard(callTime) {
      if (i < cardsBehind.length) {
        const now = callTime;
        const elapsed = now - then;
        if (elapsed > fpsInterval) {
          cardsBehind[i].style.opacity = 1;
          i++;
          then = now - (elapsed % fpsInterval);
        }
        window.requestAnimationFrame(fadeCard);
      }
    }
    if (animate) {
      fadeCard();
    } else {
      for (let j = 0; j < cardsBehind.length; j++) {
        cardsBehind[j].style.opacity = 1;
      }
    }
  }

  function destroyCards(fieldIndex) {
    angular.element(`.detector-container.card-${fieldIndex} .card-behind`).remove();

    const $frontCard = angular.element(`.population-job-container .detector-container.card-${fieldIndex} .card-front`);
    $frontCard.removeClass('card');
    $frontCard.find('.card-title').text('');
    $frontCard.css('margin-top', 0);
  }

  function sortSplitCards() {
    // cards may have moved, so redraw or remove the splits if needed
    // wrapped in a timeout to allow the digest to complete after the charts
    // has been placed on the page
    $timeout(() => {
      $scope.formConfig.fields.forEach((f, i) => {
        if (f.splitField === undefined) {
          destroyCards(i);
        } else {
          drawCards(i, false);
        }
      });
    }, 0);
  }

  let refreshInterval = REFRESH_INTERVAL_MS;
  // function for creating a new job.
  // creates the job, opens it, creates the datafeed and starts it.
  // the job may fail to open, but the datafeed should still be created
  // if the job save was successful.
  $scope.createJob = function () {
    if (validateJobId($scope.formConfig.jobId)) {
      msgs.clear();
      $scope.formConfig.mappingTypes = mlESMappingService.getTypesFromMapping($scope.formConfig.indexPattern.title);
      // create the new job
      mlPopulationJobService.createJob($scope.formConfig)
      .then((job) => {
        // if save was successful, open the job
        mlJobService.openJob(job.job_id)
        .then(() => {
          // if open was successful create a new datafeed
          saveNewDatafeed(job, true);
        })
        .catch((resp) => {
          msgs.error('Could not open job: ', resp);
          msgs.error('Job created, creating datafeed anyway');
          // if open failed, still attempt to create the datafeed
          // as it may have failed because we've hit the limit of open jobs
          saveNewDatafeed(job, false);
        });

      })
      .catch((resp) => {
        // save failed
        msgs.error('Save failed: ', resp.resp);
      });
    }

    // save new datafeed internal function
    // creates a new datafeed and attempts to start it depending
    // on startDatafeedAfterSave flag
    function saveNewDatafeed(job, startDatafeedAfterSave) {
      mlJobService.saveNewDatafeed(job.datafeed_config, job.job_id)
      .then(() => {

        if (startDatafeedAfterSave) {
          mlPopulationJobService.startDatafeed($scope.formConfig)
          .then(() => {
            $scope.jobState = JOB_STATE.RUNNING;
            refreshCounter = 0;
            refreshInterval = REFRESH_INTERVAL_MS;

            // create the interval size for querying results.
            // it should not be smaller than the bucket_span
            $scope.formConfig.resultsIntervalSeconds = $scope.formConfig.chartInterval.getInterval().asSeconds();
            const bucketSpanSeconds = parseInterval($scope.formConfig.bucketSpan).asSeconds();
            if ($scope.formConfig.resultsIntervalSeconds < bucketSpanSeconds) {
              $scope.formConfig.resultsIntervalSeconds = bucketSpanSeconds;
            }

            createResultsUrl();

            loadCharts();
          })
          .catch((resp) => {
            // datafeed failed
            msgs.error('Could not start datafeed: ', resp);
          });
        }
      })
      .catch((resp) => {
        msgs.error('Save datafeed failed: ', resp);
      });
    }
  };

  function loadCharts() {
    let forceStop = globalForceStop;
    // the percentage doesn't always reach 100, so periodically check the datafeed status
    // to see if the datafeed has stopped
    const counterLimit = 20 - (refreshInterval / REFRESH_INTERVAL_MS);
    if (refreshCounter >=  counterLimit) {
      refreshCounter = 0;
      mlPopulationJobService.checkDatafeedStatus($scope.formConfig)
      .then((status) => {
        if (status === 'stopped') {
          console.log('Stopping poll because datafeed status is: ' + status);
          $scope.$broadcast('render-results');
          forceStop = true;
        }
        run();
      });
    } else {
      run();
    }

    function run() {
      refreshCounter++;
      reloadJobSwimlaneData()
      .then(() => {
        reloadDetectorSwimlane()
        .then(() => {
          if (forceStop === false && $scope.chartData.percentComplete < 100) {
            // if state has been set to stopping (from the stop button), leave state as it is
            if ($scope.jobState === JOB_STATE.STOPPING) {
              $scope.jobState = JOB_STATE.STOPPING;
            } else {
              // otherwise assume the job is running
              $scope.jobState = JOB_STATE.RUNNING;
            }
          } else {
            $scope.jobState = JOB_STATE.FINISHED;
          }
          jobCheck();
        });
      });
    }
  }

  function jobCheck() {
    if ($scope.jobState === JOB_STATE.RUNNING || $scope.jobState === JOB_STATE.STOPPING) {
      refreshInterval = adjustRefreshInterval($scope.chartData.loadingDifference, refreshInterval);
      _.delay(loadCharts, refreshInterval);
    } else {
      _.each($scope.chartData.detectors, (chart) => {
        chart.percentComplete = 100;
      });
    }
    if ($scope.chartData.percentComplete > 0) {
      // fade the bar chart once we have results
      toggleSwimlaneVisibility();
    }
    $scope.$broadcast('render-results');
  }

  function reloadJobSwimlaneData() {
    return mlPopulationJobService.loadJobSwimlaneData($scope.formConfig);
  }


  function reloadDetectorSwimlane() {
    return mlPopulationJobService.loadDetectorSwimlaneData($scope.formConfig);
  }

  function adjustRefreshInterval(loadingDifference, currentInterval) {
    const INTERVAL_INCREASE_MS = 100;
    const MAX_INTERVAL = 10000;
    let interval = currentInterval;

    if (interval < MAX_INTERVAL) {
      if (loadingDifference < MAX_BUCKET_DIFF) {
        interval = interval + INTERVAL_INCREASE_MS;
      } else {
        if ((interval - INTERVAL_INCREASE_MS) >= REFRESH_INTERVAL_MS) {
          interval = interval - INTERVAL_INCREASE_MS;
        }
      }
    }
    return interval;
  }

  $scope.resetJob = function () {
    $scope.jobState = JOB_STATE.NOT_STARTED;
    toggleSwimlaneVisibility();

    window.setTimeout(() => {
      $scope.ui.showJobInput = true;
      $scope.loadVis();
    }, 500);
  };

  function toggleSwimlaneVisibility() {
    if ($scope.jobState === JOB_STATE.NOT_STARTED) {
      angular.element('.swimlane-cells').css('opacity', 0);
      angular.element('.bar').css('opacity', 1);
    } else {
      angular.element('.bar').css('opacity', 0.1);
    }
  }

  $scope.stopJob = function () {
    // setting the status to STOPPING disables the stop button
    $scope.jobState = JOB_STATE.STOPPING;
    mlPopulationJobService.stopDatafeed($scope.formConfig);
  };

  function createResultsUrl() {
    let jobIds = [`'${$scope.formConfig.jobId}'`];
    if ($scope.formConfig.jobGroups.length) {
      jobIds = $scope.formConfig.jobGroups.map(group => `'${group}.${$scope.formConfig.jobId}'`);
    }
    const jobIdsString = jobIds.join(',');

    const from = moment($scope.formConfig.start).toISOString();
    const to = moment($scope.formConfig.end).toISOString();
    let path = '';
    path += 'ml#/explorer';
    path += `?_g=(ml:(jobIds:!(${jobIdsString}))`;
    path += `,refreshInterval:(display:Off,pause:!f,value:0),time:(from:'${from}'`;
    path += `,mode:absolute,to:'${to}'`;
    path += '))&_a=(filters:!(),query:(query_string:(analyze_wildcard:!t,query:\'*\')))';

    $scope.resultsUrl = path;
  }

  function validateJobId(jobId) {
    let valid = true;
    const checks = $scope.ui.validation.checks;

    _.each(checks, (item) => {
      item.valid = true;
    });

    if (_.isEmpty(jobId)) {
      checks.jobId.valid = false;
    } else if (isJobIdValid(jobId) === false) {
      checks.jobId.valid = false;
      let msg = 'Job name can contain lowercase alphanumeric (a-z and 0-9), hyphens or underscores; ';
      msg += 'must start and end with an alphanumeric character';
      checks.jobId.message = msg;
    }

    $scope.formConfig.jobGroups.forEach(group => {
      if (isJobIdValid(group) === false) {
        checks.groupIds.valid = false;
        let msg = 'Job group names can contain lowercase alphanumeric (a-z and 0-9), hyphens or underscores; ';
        msg += 'must start and end with an alphanumeric character';
        checks.groupIds.message = msg;
      }
    });

    _.each(checks, (item) => {
      if (item.valid === false) {
        valid = false;
      }
    });

    return valid;
  }

  // resize the spilt cards on page resize.
  // when the job starts the 'Analysis running' label appearing can cause a scroll bar to appear
  // which will cause the split cards to look odd
  // TODO - all charts should resize correctly on page resize
  function resize() {
    if ($scope.formConfig.splitField !== undefined) {
      let width = angular.element('.card-front').width();
      const cardsBehind = angular.element('.card-behind');
      for (let i = 0; i < cardsBehind.length; i++) {
        cardsBehind[i].style.width = width + 'px';
        width -= (5 - (i / 2)) * 2;
      }
    }
  }

  $scope.setFullTimeRange = function () {
    mlFullTimeRangeSelectorService.setFullTimeRange($scope.ui.indexPattern, $scope.formConfig.combinedQuery);
  };

  mlESMappingService.getMappings().then(() => {
    initAgg();
    loadFields();

    $scope.loadVis();

    $scope.$evalAsync(() => {
      // populate the fields with any settings from the URL
      populateAppStateSettings(appState, $scope);
    });
  });

  $scope.$listen(timefilter, 'fetch', $scope.loadVis);

  angular.element(window).resize(() => {
    resize();
  });

  $scope.$on('$destroy', () => {
    globalForceStop = true;
    angular.element(window).off('resize');
  });
}).filter('filterAggTypes', function () {
  return (aggTypes, field) => {
    const output = [];
    _.each(aggTypes, (i) => {
      if (field.id === '__ml_event_rate_count__') {
        if(i.isCountType) {
          output.push(i);
        }
      } else {
        if(!i.isCountType) {
          output.push(i);
        }
      }
    });
    return output;
  };
});
