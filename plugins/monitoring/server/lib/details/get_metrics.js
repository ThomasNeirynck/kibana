import { isPlainObject } from 'lodash';
import Promise from 'bluebird';
import { getSeries } from './get_series';

export function getMetrics(req, indexPattern, filters = []) {
  const metrics = req.payload.metrics || [];
  return Promise.map(metrics, metric => {
    // metric names match the literal metric name, but they can be supplied in groups or individually
    let metricNames;

    if (isPlainObject(metric)) {
      metricNames = metric.keys;
    } else {
      metricNames = [ metric ];
    }

    return Promise.map(metricNames, metricName => {
      return getSeries(req, indexPattern, metricName, filters);
    });
  })
  .then(rows => {
    const data = {};
    metrics.forEach((key, index) => {
      // keyName must match the value stored in the html template
      const keyName = isPlainObject(key) ? key.name : key;
      data[keyName] = rows[index];
    });
    return data;
  });
};
