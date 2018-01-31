import { handleActions } from 'redux-actions';
import {
  filterChanged,
  pageChanged,
  pageSizeChanged,
  sortChanged,
  showSystemIndicesChanged,
} from '../actions';

const defaultState = {
  filter: '',
  pageSize: 10,
  currentPage: 0,
  sortField: 'index.name',
  isSortAscending: true,
  showSystemIndices: false,
};

export const tableState = handleActions({
  [filterChanged](state, action) {
    const { filter } = action.payload;
    return {
      ...state,
      filter,
      currentPage: 0
    };
  },
  [showSystemIndicesChanged](state, action) {
    const { showSystemIndices } = action.payload;

    return {
      ...state,
      showSystemIndices,
    };
  },
  [sortChanged](state, action) {
    const { sortField, isSortAscending } = action.payload;

    return {
      ...state,
      sortField,
      isSortAscending,
    };
  },
  [pageChanged](state, action) {
    const { pageNumber } = action.payload;
    return {
      ...state,
      currentPage: pageNumber,
    };
  },
  [pageSizeChanged](state, action) {
    const { pageSize } = action.payload;
    return {
      ...state,
      pageSize
    };
  }
}, defaultState);
