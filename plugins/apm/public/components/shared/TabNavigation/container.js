import { connect } from 'react-redux';
import TabNavigation from './index';

import { getUrlParams } from '../../../store/urlParams';

function mapStateToProps(state = {}) {
  return {
    location: state.location,
    urlParams: getUrlParams(state)
  };
}

const mapDispatchToProps = {};
export default connect(mapStateToProps, mapDispatchToProps)(TabNavigation);
