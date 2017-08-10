import { BaseAction } from './base_action';
import { ACTION_TYPES } from '../../../common/constants';

export class EmailAction extends BaseAction {
  constructor(props) {
    props.type = ACTION_TYPES.EMAIL;
    super(props);

    this.to = props.to;
    this.subject = props.subject;
    this.body = props.body;
  }

  // To Kibana
  get downstreamJson() {
    const result = super.downstreamJson;
    Object.assign(result, {
      to: this.to,
      subject: this.subject,
      body: this.body
    });

    return result;
  }

  // From Kibana
  static fromDownstreamJson(json) {
    const props = super.getPropsFromDownstreamJson(json);

    Object.assign(props, {
      to: json.to,
      subject: json.subject,
      body: json.body
    });

    return new EmailAction(props);
  }

  // To Elasticsearch
  get upstreamJson() {
    const result = super.upstreamJson;

    result[this.id] = {
      email: {
        profile: 'standard',
        to: this.to,
        subject: this.subject,
        body: {
          text: this.body
        }
      }
    };

    return result;
  }

  // From Elasticsearch
  static fromUpstreamJson(json) {
    const props = super.getPropsFromUpstreamJson(json);

    if (!json.actionJson.email) {
      throw new Error('json argument must contain an actionJson.email property');
    }
    if (!json.actionJson.email.to) {
      throw new Error('json argument must contain an actionJson.email.to property');
    }
    if (!json.actionJson.email.subject) {
      throw new Error('json argument must contain an actionJson.email.subject property');
    }
    if (!json.actionJson.email.body) {
      throw new Error('json argument must contain an actionJson.email.body property');
    }

    Object.assign(props, {
      to: json.actionJson.email.to,
      subject: json.actionJson.email.subject,
      body: json.actionJson.email.body.text
    });

    return new EmailAction(props);
  }

  /*
  json.actionJson should have the following structure:
  {
    "email" : {
      "profile": "standard",
      "to" : "foo@bar.com",  // or [ "foo@bar.com", "bar@foo.com" ]
      "subject" : "foobar subject",
      "body" : {
        "text" : foobar body text"
      }
    }
  }
  */
};
