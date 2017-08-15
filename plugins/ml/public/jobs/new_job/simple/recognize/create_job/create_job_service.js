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

import angular from 'angular';
import 'ui/timefilter';

import { getQueryFromSavedSearch } from 'plugins/ml/jobs/new_job/simple/components/utils/simple_job_utils';
import { SavedObjectsClientProvider } from 'ui/saved_objects';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlCreateRecognizerJobsService', function (
  es,
  timefilter,
  Private,
  $http,
  chrome,
  mlJobService) {

  const savedObjectsClient = Private(SavedObjectsClientProvider);

  this.createJob = function (job, formConfig) {
    return new Promise((resolve, reject) => {
      const newJob = angular.copy(job.jobConfig);
      const jobId = formConfig.jobLabel + job.id;
      newJob.job_id = jobId;

      mlJobService.saveNewJob(newJob)
      .then((resp) => {
        if (resp.success) {
          resolve(resp);
        } else {
          reject(resp);
        }
      });

    });
  };

  this.createDatafeed = function (job, formConfig) {
    return new Promise((resolve, reject) => {
      const jobId = formConfig.jobLabel + job.id;

      mlJobService.saveNewDatafeed(job.datafeedConfig, jobId)
      .then((resp) => {
        resolve(resp);
      })
      .catch((resp) => {
        reject(resp);
      });
    });
  };

  this.startDatafeed = function (job, formConfig) {
    const jobId = formConfig.jobLabel + job.id;
    const datafeedId = mlJobService.getDatafeedId(jobId);
    return mlJobService.startDatafeed(datafeedId, job.id, formConfig.start, formConfig.end);
  };

  this.stopDatafeed = function (formConfig) {
    const datafeedId = mlJobService.getDatafeedId(formConfig.jobId);
    return mlJobService.stopDatafeed(datafeedId, formConfig.jobId);
  };

  this.checkDatafeedStatus = function (formConfig) {
    return mlJobService.updateSingleJobDatafeedState(formConfig.jobId);
  };

  this.loadExistingSavedObjects = function (type) {
    return savedObjectsClient.find({ type, perPage: 1000 });
  };

  this.createSavedObject = function (type, obj) {
    return savedObjectsClient.create(type, obj);
  };

  this.createSavedObjectWithId = function (type, id, obj) {
    const basePath = chrome.addBasePath('/api/saved_objects');
    const url = `${basePath}/${type}/${id}`;

    return $http.post(url, { attributes: obj })
    .catch(e => {
      throw e.data.message;
    });
  };

  this.indexTimeRange = function (indexPattern, formConfig) {
    return new Promise((resolve, reject) => {
      const obj = { success: true, start: { epoch:0, string:'' }, end: { epoch:0, string:'' } };
      const query = getQueryFromSavedSearch(formConfig);

      es.search({
        index: indexPattern.title,
        size: 0,
        body: {
          query,
          aggs: {
            earliest: {
              min: {
                field: indexPattern.timeFieldName
              }
            },
            latest: {
              max: {
                field: indexPattern.timeFieldName
              }
            }
          }
        }
      })
      .then((resp) => {
        if (resp.aggregations && resp.aggregations.earliest && resp.aggregations.latest) {
          obj.start.epoch = resp.aggregations.earliest.value;
          obj.start.string = resp.aggregations.earliest.value_as_string;

          obj.end.epoch = resp.aggregations.latest.value;
          obj.end.string = resp.aggregations.latest.value_as_string;
        }
        resolve(obj);
      })
      .catch((resp) => {
        reject(resp);
      });
    });
  };

});
