import { BaseWatch } from './base_watch';
import { WATCH_TYPES } from '../../../common/constants';

export class MonitoringWatch extends BaseWatch {
  // This constructor should not be used directly.
  // JsonWatch objects should be instantiated using the
  // fromUpstreamJson and fromDownstreamJson static methods
  constructor(props) {
    props.type = WATCH_TYPES.MONITORING;
    super(props);

    this.isSystemWatch = true;
  }

  get watchJSON() {
    return {};
  }

  getVisualizeQuery() {
    throw new Error('getVisualizeQuery called for monitoring watch');
  }

  formatVisualizeData() {
    throw new Error('formatVisualizeData called for monitoring watch');
  }

  // To Elasticsearch
  get upstreamJSON() {
    throw new Error('upstreamJSON called for monitoring watch');
  }

  // To Kibana
  get downstreamJSON() {
    const result = super.downstreamJSON;
    return result;
  }

  // From Elasticsearch
  static fromUpstreamJSON(json) {
    const props = super.getPropsFromUpstreamJSON(json);

    return new MonitoringWatch(props);
  }

  // From Kibana
  static fromDownstreamJSON() {
    throw new Error('fromDownstreamJSON called for monitoring watch');
  }

};
