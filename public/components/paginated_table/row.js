/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2016 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

 // copy of ui/public/directives/row.js
 // overridden to add the option for row expansion.

import $ from 'jquery';
import _ from 'lodash';
import AggConfigResult from 'ui/vis/agg_config_result';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/ml');

module.directive('prlRows', function ($compile, $rootScope, getAppState, Private) {
  const filterBarClickHandler = Private(require('ui/filter_bar/filter_bar_click_handler'));
  return {
    restrict: 'A',

    link: function ($scope, $el, attr) {
      function addCell($tr, contents) {
        let $cell = $(document.createElement('td'));

        // TODO: It would be better to actually check the type of the field, but we don't have
        // access to it here. This may become a problem with the switch to BigNumber
        if (_.isNumeric(contents)) {
          $cell.addClass('numeric-value');
        }

        const createAggConfigResultCell = function (aggConfigResult) {
          const $cell = $(document.createElement('td'));
          const $state = getAppState();
          const clickHandler = filterBarClickHandler($state);
          $cell.scope = $scope.$new();
          $cell.addClass('cell-hover');
          $cell.attr('ng-click', 'clickHandler($event)');
          $cell.scope.clickHandler = function (event) {
            if ($(event.target).is('a')) return; // Don't add filter if a link was clicked
            clickHandler({ point: { aggConfigResult: aggConfigResult } });
          };
          return $compile($cell)($cell.scope);
        };

        if (contents instanceof AggConfigResult) {
          if (contents.type === 'bucket' && contents.aggConfig.field() && contents.aggConfig.field().filterable) {
            $cell = createAggConfigResultCell(contents);
          }
          contents = contents.toString('html');
        }

        if (_.isObject(contents)) {
          if (contents.attr) {
            $cell.attr(contents.attr);
          }

          if (contents.class) {
            $cell.addClass(contents.class);
          }

          if (contents.scope) {
            $cell = $compile($cell.html(contents.markup))(contents.scope);
          } else {
            $cell.html(contents.markup);
          }
        } else {
          if (contents === '') {
            $cell.html('&nbsp;');
          } else {
            $cell.html(contents);
          }
        }

        $tr.append($cell);
      }

      function maxRowSize(max, row) {
        return Math.max(max, row.length);
      }

      $scope.$watchMulti([
        attr.prlRows,
        attr.prlRowsMin
      ], function (vals) {
        let rows = vals[0];
        const min = vals[1];

        $el.empty();

        if (!_.isArray(rows)) rows = [];
        const width = rows.reduce(maxRowSize, 0);

        if (isFinite(min) && rows.length < min) {
          // clone the rows so that we can add elements to it without upsetting the original
          rows = _.clone(rows);
        }

        rows.forEach(function (row) {
          if (row.length) {
            const rowScope = row[0].scope;
            const $tr = $(document.createElement('tr')).appendTo($el);
            row.forEach(function (cell) {
              addCell($tr, cell);
            });

            if (rowScope &&
                rowScope.expandable &&
                rowScope.expandElement && // the tag name of the element which contains the expanded row's contents
                row.join('') !== '') {    // empty rows are passed in as an array of empty cols, ie ['','','']

              if (rowScope.open === undefined) {
                rowScope.open = false;
              }

              if (rowScope.rowInitialised === undefined) {
                rowScope.rowInitialised = false;
              }

              rowScope.toggleRow = function () {
                this.open = !this.open;
                if (this.initRow && this.rowInitialised === false) {
                  this.rowInitialised = true;
                  this.initRow();
                }
              };

              const $trExpand = $(document.createElement('tr')).appendTo($el);
              $trExpand.attr('ng-show', 'open');
              $trExpand.addClass('row-expand');

              const $td = $(document.createElement('td')).appendTo($trExpand);
              $td.attr('colspan', row.length);

              const expEl = rowScope.expandElement;
              const $exp = $(document.createElement(expEl)).appendTo($td);

              // if expand element already exits and has child elements,
              // copy them to the new expand element
              if (rowScope.$expandElement && rowScope.$expandElement.children().length) {
                $exp.append(rowScope.$expandElement.children()[0]);
              }

              $compile($trExpand)(rowScope);
              rowScope.$expandElement = $exp;
            }
          }
        });
      });
    }
  };
});
