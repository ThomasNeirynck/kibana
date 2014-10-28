/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2014     *
 *                                                          *
 *----------------------------------------------------------*
 *----------------------------------------------------------*
 * WARNING:                                                 *
 * THIS FILE CONTAINS UNPUBLISHED PROPRIETARY               *
 * SOURCE CODE WHICH IS THE PROPERTY OF PRELERT LTD AND     *
 * PARENT OR SUBSIDIARY COMPANIES.                          *
 * PLEASE READ THE FOLLOWING AND TAKE CAREFUL NOTE:         *
 *                                                          *
 * This source code is confidential and any person who      *
 * receives a copy of it, or believes that they are viewing *
 * it without permission is asked to notify Prelert Ltd     *
 * on +44 (0)20 3567 1249 or email to legal@prelert.com.    *
 * All intellectual property rights in this source code     *
 * are owned by Prelert Ltd.  No part of this source code   *
 * may be reproduced, adapted or transmitted in any form or *
 * by any means, electronic, mechanical, photocopying,      *
 * recording or otherwise.                                  *
 *                                                          *
 *----------------------------------------------------------*
 *                                                          *
 *                                                          *
 ************************************************************
 */


/** @scratch /panels/prelerttimeserieschart/0
 *
 * == prelerttimeserieschart
 * Status: *Stable*
 *
 * The prelerttimeserieschart panel is used for the display of a time chart whose data is obtained
 * via the Prelert Anomaly Detective Engine API. It includes modes for displaying anomaly
 * data in a variety of ways.
 */
define([
  'angular',
  'app',
  'jquery',
  'lodash',
  'kbn',
  'moment',
  'panels/histogram/timeSeries',
  'numeral',
  'jquery.flot',
  'jquery.flot.events',
  'jquery.flot.selection',
  'jquery.flot.time',
  'jquery.flot.byte',
  'jquery.flot.stack',
  'jquery.flot.stackpercent'
],
function (angular, app, $, _, kbn, moment, timeSeries, numeral) {

  'use strict';

  var module = angular.module('prelert.panels.prelerttimeserieschart', []);
  app.useModule(module);

  module.controller('prelerttimeserieschart', function($scope, querySrv, dashboard, filterSrv) {
    $scope.panelMeta = {
      modals : [
        {
          description: "Inspect",
          icon: "icon-info-sign",
          partial: "app/partials/inspector.html",
          show: false
        }
      ],
      editorTabs : [
        {
          title:'Style',
          src:'app/panels/prelerttimeserieschart/styleEditor.html'
        }
      ],
      status  : "Stable",
      description : "A bucketed time series chart of anomaly data obtained via the Prelert " +
              "Anomaly Detective Engine API. It includes various options for configuring how the data is plotted."
    };

    // Set and populate defaults
    var _d = {
      /** @scratch /panels/prelerttimeserieschart/1
       *
       * === Parameters
       * ==== Axis options
       * mode:: Value to use for the y-axis. For all modes other than count, +value_field+ must be
       * defined. Possible values: count, mean, max, min, total.
       */
      mode          : 'count',
      /** @scratch /panels/prelerttimeserieschart/1
       * max_results:: Maximum number of results to obtain from the Engine API endpoint in a single query.
       * TODO - may be able to do away with this param if data is obtained from a 'charting' endpoint
       *        or from Elasticsearch. 
       */
      max_results   : 20000,
      /** @scratch /panels/prelerttimeserieschart/1
       * time_field:: x-axis field, containing date/time data from the Engine API.
       */
      time_field    : 'timestamp',
      /** @scratch /panels/prelerttimeserieschart/1
       * value_field:: y-axis field if +mode+ is set to mean, max, min or total. Must be numeric.
       */
      value_field   : null,
      /** @scratch /panels/prelerttimeserieschart/1
       * x-axis:: Show the x-axis
       */
      'x-axis'      : true,
      /** @scratch /panels/prelerttimeserieschart/1
       * y-axis:: Show the y-axis
       */
      'y-axis'      : true,
      /** @scratch /panels/prelerttimeserieschart/1
       * scale:: Scale the y-axis by this factor
       */
      scale         : 1,
      /** @scratch /panels/prelerttimeserieschart/1
       * y_format:: 'none','bytes','short '
       */
      y_format    : 'none',
      /** @scratch /panels/prelerttimeserieschart/1
       * grid object:: Min and max y-axis values
       * grid.min::: Minimum y-axis value
       * grid.max::: Maximum y-axis value
       */
      grid          : {
        max: null,
        min: 0
      },
      /** @scratch /panels/prelerttimeserieschart/1
       *
       * ==== Annotations
       * annotate object:: A query can be specified, the results of which will be displayed as markers on
       * the chart. For example, for noting code deploys.
       * annotate.enable::: Should annotations, aka markers, be shown?
       * annotate.query::: Lucene query_string syntax query to use for markers.
       * annotate.size::: Max number of markers to show
       * annotate.field::: Field from documents to show
       * annotate.sort::: Sort array in format [field,order], For example [`timestamp',`desc']
       */
      annotate      : {
        enable      : false,
        query       : "*",
        size        : 20,
        field       : '_type',
        sort        : ['_score','desc']
      },
      /** @scratch /panels/prelerttimeserieschart/1
       * ==== Interval options
       * auto_int:: Automatically scale intervals?
       */
      auto_int      : true,
      /** @scratch /panels/prelerttimeserieschart/1
       * resolution:: If auto_int is true, shoot for this many bars.
       */
      resolution    : 100,
      /** @scratch /panels/prelerttimeserieschart/1
       * interval:: If auto_int is set to false, use this as the interval.
       */
      interval      : '5m',
      /** @scratch /panels/prelerttimeserieschart/1
       * interval:: Array of possible intervals in the *View* selector. Example [`auto',`1s',`5m',`3h']
       */
      intervals     : ['auto','1s','1m','5m','10m','30m','1h','3h','12h','1d','1w','1y'],
      /** @scratch /panels/prelerttimeserieschart/1
       * ==== Drawing options
       * lines:: Show line chart
       */
      lines         : false,
      /** @scratch /panels/prelerttimeserieschart/1
       * fill:: Area fill factor for line charts, 1-10
       */
      fill          : 0,
      /** @scratch /panels/prelerttimeserieschart/1
       * linewidth:: Weight of lines in pixels
       */
      linewidth     : 3,
      /** @scratch /panels/prelerttimeserieschart/1
       * points:: Show points on chart
       */
      points        : false,
      /** @scratch /panels/prelerttimeserieschart/1
       * pointradius:: Size of points in pixels
       */
      pointradius   : 5,
      /** @scratch /panels/prelerttimeserieschart/1
       * bars:: Show bars on chart
       */
      bars          : true,
      /** @scratch /panels/prelerttimeserieschart/1
       * stack:: Stack multiple series
       */
      stack         : false,
      /** @scratch /panels/prelerttimeserieschart/1
       * zoomlinks:: Show `Zoom Out' link
       */
      zoomlinks     : true,
      /** @scratch /panels/prelerttimeserieschart/1
       * options:: Show quick view options section
       */
      options       : true,
      /** @scratch /panels/prelerttimeserieschart/1
       * legend:: Display the legond
       */
      legend        : true,
      /** @scratch /panels/prelerttimeserieschart/1
       * interactive:: Enable click-and-drag to zoom functionality
       */
      interactive   : true,
      /** @scratch /panels/prelerttimeserieschart/1
       * legend_counts:: Show counts in legend
       */
      legend_counts : true,
      /** @scratch /panels/prelerttimeserieschart/1
       * ==== Transformations
       * timezone:: Correct for browser timezone?. Valid values: browser, utc
       */
      timezone      : 'browser', // browser or utc
      /** @scratch /panels/prelerttimeserieschart/1
       * percentage:: Show the y-axis as a percentage of the axis total. Only makes sense for multiple
       * queries
       */
      percentage    : false,
      /** @scratch /panels/prelerttimeserieschart/1
       * zerofill:: Improves the accuracy of line charts at a small performance cost.
       */
      zerofill      : true,
      /** @scratch /panels/prelerttimeserieschart/1
       * derivative:: Show each point on the x-axis as the change from the previous point
       */

      derivative    : false,
      /** @scratch /panels/prelerttimeserieschart/1
       * tooltip object::
       * tooltip.value_type::: Individual or cumulative controls the value that is shown in the tooltip 
       *  when hovering over a point when multiple series are shown in 'stack' mode.
       */
      tooltip       : {
        value_type: 'cumulative'
      }
    };

    _.defaults($scope.panel,_d);
    _.defaults($scope.panel.tooltip,_d.tooltip);
    _.defaults($scope.panel.annotate,_d.annotate);
    _.defaults($scope.panel.grid,_d.grid);



    $scope.init = function() {
      // Hide view options by default
      $scope.options = false;

      $scope.get_data();

    };

    $scope.set_interval = function(interval) {
      if(interval !== 'auto') {
        $scope.panel.auto_int = false;
        $scope.panel.interval = interval;
      } else {
        $scope.panel.auto_int = true;
      }
    };

    $scope.interval_label = function(interval) {
      return $scope.panel.auto_int && interval === $scope.panel.interval ? interval+" (auto)" : interval;
    };

    /**
     * Returns the time range currently set in the chart.
     */
    $scope.get_time_range = function () {
      var range = $scope.range = filterSrv.timeRange('last');
      return range;
    };

    $scope.get_interval = function () {
      var interval = $scope.panel.interval,
                      range;
      if ($scope.panel.auto_int) {
        range = $scope.get_time_range();
        if (range) {
          interval = kbn.secondsToHms(
            kbn.calculate_interval(range.from, range.to, $scope.panel.resolution, 0) / 1000
          );
        }
      }
      $scope.panel.interval = interval || '10m';
      return $scope.panel.interval;
    };
    
    /**
     * Fetch all the data for the current job. Before obtaining the anomaly data from the 
     * engine API, the function checks if a range has been set on the chart, and if not
     * sets the range to between the times of the first and last buckets for the job.
     */
    $scope.get_data = function() {
        
      delete $scope.panel.error;

      // If no index (i.e. job ID) is set, then return. 
      var jobId = $scope.dashboard.current.index.default;
      if (_.isUndefined(jobId) || _.isEmpty(jobId)) {
          return;
      }
      
      // No range set (e.g. by using the time picker, or having zoomed in),
      // so set the range to the times of the first and last buckets.
      var _range = $scope.get_time_range();
      if (!_range) {
          
          $scope.range = {
                  from: moment().subtract('h', 1).toDate(),
                  to: moment().toDate(),
                };

          var request = $scope.ejs.Request({
              'indices': jobId,
              'types':'bucket'
          });
          var earliestQuery = request.query(
                  $scope.ejs.MatchAllQuery())
                  .fields('_source')
                  .sort('id', 'asc')
                  .size(1);
          
          earliestQuery.doSearch().then(function(results) {
             var firstBucket = _.first(results.hits.hits);
             var earliestDate = new Date(parseInt(firstBucket._id)*1000);
             $scope.range.from = earliestDate;
             
             var latestRequest = $scope.ejs.Request({
                 'indices': jobId,
                 'types':'bucket'
             });
             
             latestRequest = latestRequest.query(
                     $scope.ejs.MatchAllQuery())
                     .fields('_source')
                     .sort('id', 'desc')
                     .size(1);
             
             latestRequest.doSearch().then(function(results) {
                var lastBucket = _.first(results.hits.hits);
                var latestDate = new Date(parseInt(lastBucket._id)*1000);
                if (latestDate.getTime() != $scope.range.from.getTime()) {
                    $scope.range.to = latestDate;
                } else {
                    // Only one bucket - display one extra hour.
                    $scope.range.to = new Date((parseInt(lastBucket._id)+3600)*1000);
                }
                
                $scope.get_anomaly_data();
             });
             
          });
          
      }
      else {
          $scope.get_anomaly_data();
      }
    };
    

    /**
     * Fetch the anomaly data for the current job.
     *
     * The results of this function are stored on the scope's data property. This property will be an
     * array of objects with the properties info, time_series, and hits. These objects are used in the
     * render_panel function to create the time series chart.
     */
    $scope.get_anomaly_data = function() {

      // If no index (i.e. job ID) is set, then return. 
      var jobId = $scope.dashboard.current.index.default;
      if (_.isUndefined(jobId) || _.isEmpty(jobId)) {
          return;
      }
      
      var _range = $scope.range;
      var _interval = $scope.get_interval();
      
      if ($scope.panel.auto_int) {
          
          if (_range) {
              $scope.panel.interval = kbn.secondsToHms(
                      kbn.calculate_interval(_range.from,_range.to,$scope.panel.resolution,0)/1000);
          }
          else {
              // Default to hourly intervals (rather than kbn.calculate_interval() default of 1 year).
              $scope.panel.interval = '1h';
          }
          _interval = $scope.panel.interval;
      }
      
      // Need the interval between points configured on the panel (in ms).
      // This will be used for creating the bar chart buckets.
      var intervalMs = kbn.interval_to_seconds($scope.panel.interval) * 1000;

      $scope.panelMeta.loading = true;
      
      $scope.legend = [];
      $scope.hits = 0;
      var data = [];
      $scope.annotations = [];


      // Get the anomalies from the Engine API Results service.
      // TODO - with charting endpoint should be no need to have a max_results panel config option.
      // TODO - can data source (API/ES) handle result granularity?
      // TODO - pass in any filter.
      var params = {
              take: $scope.panel.max_results
      };
      
      // Check for a time filter. If present, add the last filter in the zoom 'chain'.
      var timeFilters = filterSrv.getByType('time', false);
      var numKeys = _.keys(timeFilters).length;
      if (numKeys > 0) {
          var timeFilter = timeFilters[(numKeys-1)];
          
          var from = kbn.parseDate(timeFilter.from);
          var to = kbn.parseDate(timeFilter.to);
          
          // Default moment.js format() is ISO8601.
          params.start = moment(from).format();
          params.end = moment(to).format();
      } 
      
      $scope.prelertjs.ResultsService.getBuckets(jobId, params)
      .success(function(results) {
          
          $scope.panelMeta.loading = false;
          
          $scope.hits = results.hitCount;
          
          // For now just plot a single series.
          // TODO - add ability to plot multiple series on a chart?
          console.log("prelerttimeserieschart results from ResultsService:");
          console.log(results);

          var tsOpts = {
                  interval: _interval,
                  start_date: _range && _range.from,
                  end_date: _range && _range.to,
                  fill_style: $scope.panel.derivative ? 'null' : $scope.panel.zerofill ? 'minimal' : 'no'
                };
          var time_series = new timeSeries.ZeroFilled(tsOpts);
          var counters = {}; // Stores the bucketed (chart buckets, not analytic buckets!) hit counts.

          // Push each entry into the time series, calculating chart bucket values
          // according to configured chart metric and point interval.
          _.each(results.documents, function(bucket) {
            var value;
            var bucketTime = moment(bucket[$scope.panel.time_field]).valueOf(); // In ms.
            
            // Get the time of the data point, flooring the time of the bucket to the appropriate interval.
            var roundedTime = (moment(Math.floor(bucketTime / intervalMs) * intervalMs)).valueOf(); // In ms.
            counters[roundedTime] = (counters[roundedTime] || 0) + 1; // No aggregation done by API, increment by 1.
            
            if ($scope.panel.mode === 'min'){
                if(_.isUndefined(time_series._data[roundedTime])) {
                    value = bucket[$scope.panel.value_field];
                } else {
                    value = Math.min(time_series._data[roundedTime], bucket[$scope.panel.value_field]);
                }
            } else if ($scope.panel.mode === 'max'){
                if(_.isUndefined(time_series._data[roundedTime])) {
                    value = bucket[$scope.panel.value_field];
                } else {
                    value = Math.max(time_series._data[roundedTime], bucket[$scope.panel.value_field]);
                }
            } else if ($scope.panel.mode === 'total'){
                value = (time_series._data[roundedTime] || 0) + bucket[$scope.panel.value_field];
            } else if($scope.panel.mode === 'count') {
                value = counters[roundedTime];
            } else if ($scope.panel.mode === 'mean') {
                // Compute the ongoing mean by multiplying the existing mean by the existing hits
                // plus the new mean multiplied by the new hits divided by the total hits
                value = (((time_series._data[roundedTime] || 0)*(counters[roundedTime]-1)) + bucket[$scope.panel.value_field])/(counters[roundedTime]);
            } 

            time_series.addValue(roundedTime, value);
            
          });
          
          data[0] = {
                  time_series: time_series,
                  hits : results.hitCount,
                  info : {color: querySrv.colors[0],
                          label: jobId}
                };

          // Use the jobId as the legend text.
          $scope.legend[0] = {label:jobId,hits:results.documents.length,color:querySrv.colors[0]};
          

          // Tell the histogram directive to render.
          $scope.$emit('render', data);
          
      })
      .error(function (error) {
          $scope.panelMeta.loading = false;
          $scope.panel.error = $scope.parse_error("Error obtaining results from the Prelert Engine API." +
                 "Please ensure the Engine API is running and configured correctly.");
          console.log('Error loading list of results from the Prelert Engine API: ' + error.message);
      });

    };

    // function $scope.zoom
    // factor :: Zoom factor, so 0.5 = cuts timespan in half, 2 doubles timespan
    $scope.zoom = function(factor) {
      var _range = filterSrv.timeRange('last');
      
      if (_range) {
          var _timespan = (_range.to.valueOf() - _range.from.valueOf());
          var _center = _range.to.valueOf() - _timespan/2;
    
          var _to = (_center + (_timespan*factor)/2);
          var _from = (_center - (_timespan*factor)/2);
    
          // If we're not already looking into the future, don't.
          if(_to > Date.now() && _range.to < Date.now()) {
            var _offset = _to - Date.now();
            _from = _from - _offset;
            _to = Date.now();
          }
    
          if(factor > 1) {
            // Pass 'true' as noRefresh, as dashboard will be refreshed when time filter is set below.
            filterSrv.removeByType('time', true);
          }
          filterSrv.set({
            type:'time',
            from:moment.utc(_from).toDate(),
            to:moment.utc(_to).toDate(),
            field:$scope.panel.time_field
          });
      
      }
    };


    $scope.set_refresh = function (state) {
      $scope.refresh = state;
    };

    $scope.close_edit = function() {
      if($scope.refresh) {
        $scope.get_data();
      }
      $scope.refresh =  false;
      $scope.$emit('render');
    };

    $scope.render = function() {
      $scope.$emit('render');
    };

  });

  module.directive('prelertTimeSeriesChart', function(dashboard, filterSrv) {
    return {
      restrict: 'A',
      template: '<div></div>',
      link: function(scope, elem) {
        var data, plot;

        scope.$on('refresh',function(){
          scope.get_data();
        });

        // Receive render events
        scope.$on('render',function(event,d){
          data = d || data;
          render_panel(data);
        });

        scope.$watch('panel.span', function(){
          render_panel(data);
        });

        // Re-render if the window is resized
        angular.element(window).bind('resize', function(){
          render_panel(data);
        });

        var scale = function(series,factor) {
          return _.map(series,function(p) {
            return [p[0],p[1]*factor];
          });
        };

        var scaleSeconds = function(series,interval) {
          return _.map(series,function(p) {
            return [p[0],p[1]/kbn.interval_to_seconds(interval)];
          });
        };

        var derivative = function(series) {
          return _.map(series, function(p,i) {
            var _v;
            if(i === 0 || p[1] === null) {
              _v = [p[0],null];
            } else {
              _v = series[i-1][1] === null ? [p[0],null] : [p[0],p[1]-(series[i-1][1])];
            }
            return _v;
          });
        };

        // Function for rendering panel
        function render_panel(data) {
          // IE doesn't work without this
          try {
            elem.css({height:scope.row.height});
          } catch(e) {return;}

          // Set the label and color for each series.
          try {
            _.each(data, function(series) {
              series.label = series.info.label;
              series.color = series.info.color;
            });
          } catch(e) {return;}

          // Set barwidth based on specified interval
          var barwidth = kbn.interval_to_ms(scope.panel.interval);

          var stack = scope.panel.stack ? true : null;

          // Populate element
          try {
            var options = {
              legend: { show: false },
              series: {
                stackpercent: scope.panel.stack ? scope.panel.percentage : false,
                stack: scope.panel.percentage ? null : stack,
                lines:  {
                  show: scope.panel.lines,
                  // Silly, but fixes bug in stacked percentages
                  fill: scope.panel.fill === 0 ? 0.001 : scope.panel.fill/10,
                  lineWidth: scope.panel.linewidth,
                  steps: false
                },
                bars:   {
                  show: scope.panel.bars,
                  fill: 1,
                  barWidth: barwidth/1.5,
                  zero: false,
                  lineWidth: 0
                },
                points: {
                  // Show point if only one data point in range.
                  show: scope.panel.points ? scope.panel.points : (!scope.panel.bars && data[0].hits == 1),
                  fill: 1,
                  fillColor: false,
                  radius: scope.panel.pointradius
                },
                shadowSize: 1
              },
              yaxis: {
                show: scope.panel['y-axis'],
                min: scope.panel.grid.min,
                max: scope.panel.percentage && scope.panel.stack ? 100 : scope.panel.grid.max
              },
              xaxis: {
                timezone: scope.panel.timezone,
                show: scope.panel['x-axis'],
                mode: "time",
                min: _.isUndefined(scope.range.from) ? null : scope.range.from.getTime(),
                max: _.isUndefined(scope.range.to) ? null : scope.range.to.getTime(),
                timeformat: "%H:%M<br>%Y-%m-%d",
                label: "Datetime",
                ticks: elem.width()/120
              },
              grid: {
                backgroundColor: null,
                borderWidth: 0,
                hoverable: true,
                color: '#c8c8c8'
              }
            };

            if (scope.panel.y_format === 'bytes') {
              options.yaxis.mode = "byte";
              options.yaxis.tickFormatter = function (val, axis) {
                return kbn.byteFormat(val, 0, axis.tickSize);
              };
            }

            if (scope.panel.y_format === 'short') {
              options.yaxis.tickFormatter = function (val, axis) {
                return kbn.shortFormat(val, 0, axis.tickSize);
              };
            }

            if(scope.panel.annotate.enable) {
              options.events = {
                clustering: true,
                levels: 1,
                data: scope.annotations,
                types: {
                  'annotation': {
                    level: 1,
                    icon: {
                      width: 20,
                      height: 21,
                      icon: "histogram-marker"
                    }
                  }
                }
                //xaxis: int    // the x axis to attach events to
              };
            }

            if(scope.panel.interactive) {
              options.selection = { mode: "x", color: '#666' };
            }

            // when rendering stacked bars, we need to ensure each point that has data is zero-filled
            // so that the stacking happens in the proper order
            var required_times = [];
            if (data.length > 1) {
              required_times = Array.prototype.concat.apply([], _.map(data, function (query) {
                return query.time_series.getOrderedTimes();
              }));
              required_times = _.uniq(required_times.sort(function (a, b) {
                // decending numeric sort
                return a-b;
              }), true);
            }


            for (var i = 0; i < data.length; i++) {
              var _d = data[i].time_series.getFlotPairs(required_times);
              if(scope.panel.derivative) {
                _d = derivative(_d);
              }
              if(scope.panel.scale !== 1) {
                _d = scale(_d,scope.panel.scale);
              }
              if(scope.panel.scaleSeconds) {
                _d = scaleSeconds(_d,scope.panel.interval);
              }
              data[i].data = _d;
            }

            plot = $.plot(elem, data, options);

          } catch(e) {
            // Nothing to do here
          }
        }

        var $tooltip = $('<div>');
        elem.bind("plothover", function (event, pos, item) {
          var seriesId, value, timestamp;

          if (item) {  
            seriesId = '<small style="font-size:0.9em;">' +
              '<i class="icon-circle" style="color:'+item.series.color+';"></i> ' + 
              item.series.label + '</small><br>';
            
            if (scope.panel.value_field && scope.panel.mode != 'count') {
                seriesId = seriesId + scope.panel.value_field + ': ';
            }

            value = (scope.panel.stack && scope.panel.tooltip.value_type === 'individual') ?
              item.datapoint[1] - item.datapoint[2] :
              item.datapoint[1];
              
            if(scope.panel.y_format === 'bytes') {
              value = kbn.byteFormat(value,2);
            }
            if(scope.panel.y_format === 'short') {
              value = kbn.shortFormat(value,2);
            } else {
              value = numeral(value).format('0,0[.]000');
            }
            timestamp = scope.panel.timezone === 'browser' ?
              moment(item.datapoint[0]).format('YYYY-MM-DD HH:mm:ss') :
              moment.utc(item.datapoint[0]).format('YYYY-MM-DD HH:mm:ss');
            $tooltip
              .html(seriesId + value + " @ " + timestamp)
              .place_tt(pos.pageX, pos.pageY);
          } else {
            $tooltip.detach();
          }
        });

        elem.bind("plotselected", function (event, ranges) {
          filterSrv.set({
            type  : 'time',
            from  : moment.utc(ranges.xaxis.from).toDate(),
            to    : moment.utc(ranges.xaxis.to).toDate(),
            field : scope.panel.time_field
          });
        });
      }
    };
  });

});
