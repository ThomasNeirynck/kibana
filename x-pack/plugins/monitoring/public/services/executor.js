/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Legacy } from '../legacy_shims';
import { subscribeWithScope } from '../angular/helpers/utils';
import { Subscription } from 'rxjs';

export function executorProvider($timeout, $q) {
  const queue = [];
  const subscriptions = new Subscription();
  let executionTimer;
  let ignorePaused = false;

  /**
   * Resets the timer to start again
   * @returns {void}
   */
  function reset() {
    cancel();
    start();
  }

  function killTimer() {
    if (executionTimer) {
      $timeout.cancel(executionTimer);
    }
  }

  /**
   * Cancels the execution timer
   * @returns {void}
   */
  function cancel() {
    killTimer();
  }

  /**
   * Registers a service with the executor
   * @param {object} service The service to register
   * @returns {void}
   */
  function register(service) {
    queue.push(service);
  }

  /**
   * Stops the executor and empties the service queue
   * @returns {void}
   */
  function destroy() {
    subscriptions.unsubscribe();
    cancel();
    ignorePaused = false;
    queue.splice(0, queue.length);
  }

  /**
   * Runs the queue (all at once)
   * @returns {Promise} a promise of all the services
   */
  function run() {
    const noop = () => $q.resolve();
    return $q
      .all(
        queue.map((service) => {
          return service
            .execute()
            .then(service.handleResponse || noop)
            .catch(service.handleError || noop);
        })
      )
      .finally(reset);
  }

  function reFetch() {
    cancel();
    run();
  }

  function killIfPaused() {
    if (Legacy.shims.timefilter.getRefreshInterval().pause) {
      killTimer();
    }
  }

  /**
   * Starts the executor service if the timefilter is not paused
   * @returns {void}
   */
  function start() {
    const timefilter = Legacy.shims.timefilter;
    if (
      (ignorePaused || timefilter.getRefreshInterval().pause === false) &&
      timefilter.getRefreshInterval().value > 0
    ) {
      executionTimer = $timeout(run, timefilter.getRefreshInterval().value);
    }
  }

  /**
   * Expose the methods
   */
  return {
    register,
    start($scope) {
      $scope.$applyAsync(() => {
        const timefilter = Legacy.shims.timefilter;
        subscriptions.add(
          subscribeWithScope($scope, timefilter.getFetch$(), {
            next: reFetch,
          })
        );
        subscriptions.add(
          subscribeWithScope($scope, timefilter.getRefreshIntervalUpdate$(), {
            next: killIfPaused,
          })
        );
        start();
      });
    },
    run,
    destroy,
    reset,
    cancel,
  };
}
