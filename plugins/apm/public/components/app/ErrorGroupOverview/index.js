import { connect } from 'react-redux';
import ErrorGroupOverview from './view';
import { getUrlParams } from '../../../store/urlParams';
import {
  getErrorGroupList,
  loadErrorGroupList,
  getErrorGroupListArgs
} from '../../../store/errorGroupLists';

function mapStateToProps(state = {}) {
  return {
    listArgs: getErrorGroupListArgs(state),
    urlParams: getUrlParams(state),
    errorGroupList: getErrorGroupList(state)
  };
}

const mapDispatchToProps = {
  loadErrorGroupList
};

export default connect(mapStateToProps, mapDispatchToProps)(ErrorGroupOverview);
