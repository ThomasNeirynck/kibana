import { connect } from 'react-redux';
import PageHeader from './view';

import { getUrlParams } from '../../../store/urlParams';

function mapStateToProps(state = {}) {
  const { appName } = getUrlParams(state);

  return {
    appName
  };
}

const mapDispatchToProps = {};
export default connect(mapStateToProps, mapDispatchToProps)(PageHeader);
