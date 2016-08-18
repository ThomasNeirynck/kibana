import notify from 'ui/notify';
import chrome from 'ui/chrome';
import uiModules from 'ui/modules';
import { get, last } from 'lodash';
import moment from 'moment';
import constants from '../../server/lib/constants.js';
import 'plugins/reporting/services/job_queue';
import User from 'plugins/reporting/services/user';

uiModules.get('kibana')
.config(() => {
  // Intialize lastCheckedOn, if necessary
  if (!getLastCheckedOn()) {
    setLastCheckedOn(moment().subtract(constants.JOB_COMPLETION_CHECK_FREQUENCY_IN_MS, 'ms').toISOString());
  }
});

uiModules.get('kibana')
.run(($http, $interval, reportingJobQueue, Private) => {
  const user = Private(User).getCurrent();
  const isSecurityEnabled = user !== null;
  const isUserSignedIn = isSecurityEnabled && !!user;

  const shouldPoll = !isSecurityEnabled || isUserSignedIn;

  if (shouldPoll) {
    $interval(function startChecking() {
      getJobsCompletedSinceLastCheck($http)
      .then(jobs => jobs.forEach(job => showCompletionNotification(job, reportingJobQueue)));
    }, constants.JOB_COMPLETION_CHECK_FREQUENCY_IN_MS);
  }
});

function getLastCheckedOn() {
  return window.localStorage.getItem(constants.JOB_COMPLETION_STORAGE_KEY_LAST_CHECK);
}

function setLastCheckedOn(newValue) {
  window.localStorage.setItem(constants.JOB_COMPLETION_STORAGE_KEY_LAST_CHECK, newValue);
}

function getJobsCompletedSinceLastCheck($http) {
  const lastCheckedOn = getLastCheckedOn();

  // Get all jobs in "completed" status since last check, sorted by completion time
  const apiBaseUrl = chrome.addBasePath(constants.API_BASE_URL);
  const url = `${apiBaseUrl}/jobs/list_completed_since?since=${lastCheckedOn}`;
  return $http.get(url)
  .then(res => {
    res = res.data;
    if (res.length === 0) {
      return res;
    }

    const lastJobCompletedAt = last(res)._source.completed_at;
    setLastCheckedOn(lastJobCompletedAt);
    return res;
  });
}

function downloadReport(jobId) {
  const apiBaseUrl = chrome.addBasePath(constants.API_BASE_URL);
  const downloadLink = `${apiBaseUrl}/jobs/download/${jobId}`;
  return () => window.open(downloadLink);
}

async function showCompletionNotification(job, reportingJobQueue) {
  const reportObjectTitle = job._source.payload.title;
  const reportObjectType = job._source.payload.type;
  let notificationMessage;
  let notificationType;

  // Define actions for notification
  const actions = [
    {
      text: 'OK'
    }
  ];

  const isJobSuccessful = get(job, '_source.status') === 'completed';
  if (isJobSuccessful) {
    actions.push({
      text: 'Download',
      callback: downloadReport(job._id)
    });

    const managementUrl = chrome.getNavLinkById('kibana:management').url;
    const reportingSectionUrl = `${managementUrl}/kibana/reporting`;
    notificationMessage = `Your report for the "${reportObjectTitle}" ${reportObjectType} is ready!`
    + ` Pick it up from [Management > Kibana > Reporting](${reportingSectionUrl})`;
    notificationType = 'info';
  } else {
    const errorDoc = await reportingJobQueue.getContent(job._id);
    const error = errorDoc.content;
    notificationMessage = `There was an error generating your report for the "${reportObjectTitle}" ${reportObjectType}: ${error}`;
    notificationType = 'error';
  }

  notify.custom(notificationMessage, {
    type: notificationType,
    lifetime: 0,
    actions
  });
}
