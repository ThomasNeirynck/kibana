import React from 'react';
import numeral from 'numeral';
import moment from 'moment';
import _ from 'lodash';
import statusIconClass from '../../../lib/status_icon_class';

export default class ClusterRow extends React.Component {

  isSupported() {
    return this.props.license.type !== 'basic' || (this.props.isPrimary && this.props.allBasicClusters);
  }

  changeCluster() {
    if (this.isSupported()) {
      this.props.changeCluster(this.props.cluster_uuid);
    }
  }

  render() {

    const self = this;
    function get(path) {
      return _.get(self.props, path);
    }

    let licenseExpiry = (
      <div className="expires">
        Expires { moment(get('license.expiry_date_in_millis')).format('D MMM YY') }
      </div>
    );

    if (get('license.expiry_date_in_millis') < moment().valueOf()) {
      licenseExpiry = (<div className="expires expired">Expired</div>);
    }

    const classes = ['big'];
    let isSupported = true;
    if (!this.isSupported()) {
      classes.push('basic');
      isSupported = false;
    }

    const iconClass = statusIconClass(get('status'));
    return (
      <tr className={ classes.join(' ') }>
        <td key="Name">
          <a className='clusterName' onClick={(event) => this.changeCluster(event) }>
            { get('cluster_name') }
            &nbsp;
            { get('isPrimary') ? <i className="fa fa-star" title="Kibana uses this cluster as the primary connection"></i> : ''}
          </a>
        </td>
        <td key="Status">
          <span className={`status status-${get('status')}`}>
            <i className={iconClass} title={_.capitalize(this.props.status)}></i>
          </span>
        </td>
        <td key="Nodes">{ isSupported ? numeral(get('elasticsearch.stats.nodes.count.total')).format('0,0') : '-' }</td>
        <td key="Indices">{ isSupported ? numeral(get('elasticsearch.stats.indices.count')).format('0,0') : '-' }</td>
        <td key="Data">{ isSupported ? numeral(get('elasticsearch.stats.indices.store.size_in_bytes')).format('0,0[.]0 b') : '-' }</td>
        <td key="Kibana">{ isSupported ? numeral(get('kibana.count')).format('0,0') : '-' }</td>
        <td key="License" className="license">
          <div className="license">{ _.capitalize(get('license.type')) }</div>
          { licenseExpiry }
        </td>
      </tr>
    );
  }

}
