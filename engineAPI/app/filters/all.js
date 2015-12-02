define([
  'angular',
  'jquery',
  'lodash',
  'moment'
], function (angular, $, _, moment) {
  'use strict';

  var module = angular.module('kibana.filters');

  module.filter('stringSort', function() {
    return function(input) {
      return input.sort();
    };
  });

  module.filter('pinnedQuery', function(querySrv) {
    return function( items, pinned) {
      var ret = _.filter(querySrv.ids(),function(id){
        var v = querySrv.list()[id];
        if(!_.isUndefined(v.pin) && v.pin === true && pinned === true) {
          return true;
        }
        if((_.isUndefined(v.pin) || v.pin === false) && pinned === false) {
          return true;
        }
      });
      return ret;
    };
  });

  module.filter('slice', function() {
    return function(arr, start, end) {
      if(!_.isUndefined(arr)) {
        return arr.slice(start, end);
      }
    };
  });

  module.filter('stringify', function() {
    return function(arr) {
      if(_.isObject(arr) && !_.isArray(arr)) {
        return angular.toJson(arr);
      } else {
        return _.isNull(arr) ? null : arr.toString();
      }
    };
  });

  module.filter('moment', function() {
    return function(date,mode) {
      switch(mode) {
      case 'ago':
        return moment(date).fromNow();
      }
      return moment(date).fromNow();
    };
  });

  module.filter('noXml', function() {
    var noXml = function(text) {
      return _.isString(text)
        ? text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&quot;')
        : text;
    };
    return function(text) {
      return _.isArray(text)
        ? _.map(text, noXml)
        : noXml(text);
    };
  });

  module.filter('urlLink', function() {
    var  //URLs starting with http://, https://, or ftp://
      r1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim,
      //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
      r2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim,
      //Change email addresses to mailto:: links.
      r3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;

    var urlLink = function(text) {
      var t1,t2,t3;
      if(!_.isString(text)) {
        return text;
      } else {
        _.each(text.match(r1), function() {
          t1 = text.replace(r1, "<a href=\"$1\" target=\"_blank\">$1</a>");
        });
        text = t1 || text;
        _.each(text.match(r2), function() {
          t2 = text.replace(r2, "$1<a href=\"http://$2\" target=\"_blank\">$2</a>");
        });
        text = t2 || text;
        _.each(text.match(r3), function() {
          t3 = text.replace(r3, "<a href=\"mailto:$1\">$1</a>");
        });
        text = t3 || text;
        return text;
      }
    };
    return function(text) {
      return _.isArray(text)
        ? _.map(text, urlLink)
        : urlLink(text);
    };
  });

  module.filter('editable', function () {
    return function (data) {
      return _.filter(data, function (item) {
        return item.editable !== false;
      });
    };
  });

  module.filter('gistid', function() {
    var gist_pattern = /(\d{5,})|([a-z0-9]{10,})|(gist.github.com(\/*.*)\/[a-z0-9]{5,}\/*$)/;
    return function(input) {
      if(!(_.isUndefined(input))) {
        var output = input.match(gist_pattern);
        if(!_.isNull(output) && !_.isUndefined(output)) {
          return output[0].replace(/.*\//, '');
        }
      }
    };
  });
  
  // Based on the tableLocalTime filter in the Kibana table panel module.js, for all panel use.
  // Filter to format a String recognised by moment.js into the supplied format.
  // If format not provided, moment.js will use ISO-8601 format i.e. YYYY-MM-DDTHH:mm:ss.SSSZ
  module.filter('formatLocalTime', function(){
    return function(input,stringToFormat,format) {
      // Would normally expect 'input' to be the string to format.
      return moment(stringToFormat).format(format);
    };
  });
  
  // Copied out of Kibana table panel module.js for all panel use.
  // Truncates text in a table cell according to the total number of characters configured (trimFactor)
  // and the number of columns in the table (numberOfCols).
  module.filter('tableCellTextTruncate', function() {
      return function(text,trimFactor,numberOfCols) {
        // Truncates text to length of trimFactor 
        // divided by numberOfCols (i.e. number of columns in the table).
        if (!_.isUndefined(text) && !_.isNull(text) && text.toString().length > 0) {
          return text.length > trimFactor/numberOfCols ? text.substr(0,trimFactor/numberOfCols)+'...' : text.toString();
        } 

        return '';
 
      };
  });

  // Copied out of Kibana table panel module.js for all panel use.
  // Formats the supplied object into a JSON-formatted string for display in a table cell.
  // Use prettyLevel > 0 to retain newlines and whitespace.
  // Use prettyLevel > 1 for extra formatting of field names and values.
  module.filter('tableCellObjectJsonFormat', function() {
      var json;
      return function(obj,prettyLevel) {
        if (!_.isUndefined(obj) && !_.isNull(obj) && obj.toString().length > 0) {
          json = angular.toJson(obj,prettyLevel > 0 ? true : false);
          json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          if(prettyLevel > 1) {
            /* jshint maxlen: false */
            json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
              var cls = 'number';
              if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                  cls = 'key strong';
                } else {
                  cls = '';
                }
              } else if (/true|false/.test(match)) {
                cls = 'boolean';
              } else if (/null/.test(match)) {
                cls = 'null';
              }
              return '<span class="' + cls + '">' + match + '</span>';
            });
          }
          return json;
        }
        return '';
      };
    });
  
  // Formats anomaly score values to two decimal places, whilst not 
  // adding '.00' to whole numbers. Values greater than 0, but less than
  // 0.01 are formatted as '0.00'.
  module.filter('anomalyScore', [ '$filter', '$locale', function(filter, locale) {
      var numberFilter = filter('number');
      var formats = locale.NUMBER_FORMATS;
      return function(number) {
          var value = numberFilter(number, 2);
          if (number > 0.01 || number == 0) {
              // Split into whole and fraction parts.
              var parts = value.split(formats.DECIMAL_SEP);
              var whole = parts[0];
              var fraction = parts[1] || '00';
              fraction = fraction.substring(0,2)=='00' ? fraction.substring(2) : '.'+fraction; // remove ".00" fractions
              return whole + fraction;
          } else {
              return value;
          } 
          
      };
  }]);
 
  // Formats 'typical' and 'actual' values for time_of_day and
  // time_of_week functions, converting the raw number, which is
  // number of seconds since midnight, into a human-readable time
  module.filter('timeOfWeek', function() {
      return function(text, fx) {
          if (fx == 'time_of_week')
          {
              var d = new Date();
              var i = parseInt(text);
              d.setTime(i * 1000);
              return moment(d).format('ddd HH:mm');
          }
          else if (fx == 'time_of_day')
          {
              var d = new Date();
              var i = parseInt(text);
              d.setTime(i * 1000);
              return moment(d).format('HH:mm');
          }
          else
          {
              return text;
          }
      };
  });
 

});
