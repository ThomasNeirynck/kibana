/**
 * ELASTICSEARCH CONFIDENTIAL
 * _____________________________
 *
 *  [2014] Elasticsearch Incorporated All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Elasticsearch Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Elasticsearch Incorporated
 * and its suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Elasticsearch Incorporated.
 */

import React from 'react';
import { calculateClass } from '../lib/calculateClass';
import { vents } from '../lib/vents';

export class Shard extends React.Component {
  static displayName = 'Shard';
  state = { tooltip: false };

  componentDidMount() {
    let key;
    const shard = this.props.shard;
    const self = this;
    if (shard.tooltip_message) {
      key = this.generateKey();
      vents.on(key, function (action) {
        self.setState({ tooltip: action === 'show' });
      });
    }
  }

  generateKey = (relocating) => {
    const shard = this.props.shard;
    const shardType = shard.primary ? 'primary' : 'replica';
    const additionId = shard.state === 'UNASSIGNED' ? Math.random() : '';
    const node = relocating ? shard.relocating_node : shard.node;
    return shard.index + '.' + node + '.' + shardType + '.' + shard.shard + additionId;
  };

  componentWillUnmount() {
    let key;
    const shard = this.props.shard;
    if (shard.tooltip_message) {
      key = this.generateKey();
      vents.clear(key);
    }
  }

  toggle = (event) => {
    if (this.props.shard.tooltip_message) {
      const action = (event.type === 'mouseenter') ? 'show' : 'hide';
      const key = this.generateKey(true);
      this.setState({ tooltip: action === 'show' });
      vents.trigger(key, action);
    }
  };

  render() {
    const shard = this.props.shard;
    let tooltip;
    if (this.state.tooltip) {
      tooltip = (<div className="shard-tooltip">{ this.props.shard.tooltip_message }</div>);
    }
    return (
      <div
        onMouseEnter={this.toggle}
        onMouseLeave={this.toggle}
        className={calculateClass(shard, 'shard')}
      >
        { tooltip }{ shard.shard }
      </div>
    );
  }
}
