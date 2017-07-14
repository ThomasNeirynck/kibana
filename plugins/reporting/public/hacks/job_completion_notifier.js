import { notify } from 'ui/notify';
import chrome from 'ui/chrome';
import { uiModules } from 'ui/modules';
import { addSystemApiHeader } from 'ui/system_api';
import { get, last } from 'lodash';
import moment from 'moment';
import {
  JOB_COMPLETION_STORAGE_KEY_LAST_CHECK,
  API_BASE_URL
} from '../../common/constants.js';
import 'plugins/reporting/services/job_queue';
import { PathProvider } from 'plugins/xpack_main/services/path';
import { XPackInfoProvider } from 'plugins/xpack_main/services/xpack_info';
import { Poller } from '../../../../common/poller';

uiModules.get('kibana')
.run(($http, reportingJobQueue, Private, reportingPollConfig) => {
  const { jobCompletionNotifier } = reportingPollConfig;
  // Intialize lastCheckedOn, if necessary
  if (!getLastCheckedOn()) {
    setLastCheckedOn(moment().subtract(jobCompletionNotifier.interval, 'ms').toISOString());
  }

  const xpackInfo = Private(XPackInfoProvider);
  const showLinks = xpackInfo.get('features.reporting.management.showLinks');
  if (Private(PathProvider).isLoginOrLogout() || !showLinks) return;

  const poller = new Poller({
    functionToPoll: () => {
      return getJobsCompletedSinceLastCheck($http)
        .then(jobs => jobs.forEach(job => showCompletionNotification(job, reportingJobQueue)));
    },
    pollFrequencyInMillis: jobCompletionNotifier.interval,
    trailing: true,
    continuePollingOnError: true,
    pollFrequencyErrorMultiplier: jobCompletionNotifier.intervalErrorMultiplier
  });
  poller.start();
});

function getLastCheckedOn() {
  return window.localStorage.getItem(JOB_COMPLETION_STORAGE_KEY_LAST_CHECK);
}

function setLastCheckedOn(newValue) {
  window.localStorage.setItem(JOB_COMPLETION_STORAGE_KEY_LAST_CHECK, newValue);
}

function getJobsCompletedSinceLastCheck($http) {
  const lastCheckedOn = getLastCheckedOn();

  // Get all jobs in "completed" status since last check, sorted by completion time
  const apiBaseUrl = chrome.addBasePath(API_BASE_URL);
  const url = `${apiBaseUrl}/jobs/list_completed_since?since=${lastCheckedOn}`;
  const headers = addSystemApiHeader({});
  return $http.get(url, { headers })
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
  const apiBaseUrl = chrome.addBasePath(API_BASE_URL);
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
      text: 'OK',
      dataTestSubj: 'reportCompleteOkToastButton'
    }
  ];

  const isJobSuccessful = get(job, '_source.status') === 'completed';
  const maxSizeReached = get(job, '_source.output.max_size_reached');
  if (isJobSuccessful) {
    actions.push({
      text: 'Download',
      callback: downloadReport(job._id)
    });

    if (maxSizeReached) {
      notificationType = 'warning';
      notificationMessage = `Your report for the "${reportObjectTitle}" ${reportObjectType} is ready;` +
        `however, it reached the max size and contains partial data.`;
    } else {
      notificationType = 'info';
      notificationMessage = `Your report for the "${reportObjectTitle}" ${reportObjectType} is ready!`;
    }
    if (chrome.navLinkExists('kibana:management')) {
      const managementUrl = chrome.getNavLinkById('kibana:management').url;
      const reportingSectionUrl = `${managementUrl}/kibana/reporting`;
      notificationMessage += ` Pick it up from [Management > Kibana > Reporting](${reportingSectionUrl})`;
    }
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
