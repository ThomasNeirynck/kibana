/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2016     *
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

import _ from 'lodash';
import moment from 'moment-timezone';
import stringUtils from 'plugins/prelert/util/string_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlElasticDataDescription', ['$http', function($http) {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      ui:                 "=prlUi",
      properties:         "=prlProperties",
      dateProperties:     "=prlDateProperties",
      indices:            "=prlIndices",
      types:              "=prlTypes",
      simpleMode:         "=prlSimpleMode",
      mode:               "=prlMode",
      schedulerConfig:    "=prlSchedulerConfig",
      dataDescription:    "=prlDataDescription",
      dataLoadedCallback: "=prlDataLoadedCallback",
      exposedFunctions:   "=prlExposedFunctions",
      serverInfo:         "=prlElasticServerInfo"
    },
    template: require('plugins/prelert/jobs/components/data_description/elastic_data_description.html'),
    controller: function($scope, $q, $location, prlJobService, prlMessageBarService) {
      var msgs = prlMessageBarService; // set a reference to the message bar service
      var MODE = {NEW: 0, EDIT: 1, CLONE: 2};
      $scope.saveLock = false;
      var keyPressTimeout = null;

      $scope.timeFormatGuessed = false;
      $scope.exampleTime = "";

      if($scope.simpleMode) {
        $scope.ui.wizard.indexInputType = "TEXT";
      }

      var nonInfluencerTypes = [
        "numeric",
        "long",
        "integer",
        "short",
        "byte",
        "double",
        "float",
        "date",
        "boolean",
        "binary",
        "geo_point",
        "geo_shape",
        "completion",
        "token_count",
        "murmur3",
        "attachment"
      ];

      function init() {
        // allow the container (new_job_controller) to call some functions
        // when the JSON has been changed
        if($scope.exposedFunctions) {
          $scope.exposedFunctions.extractFields = $scope.extractFields;
          $scope.exposedFunctions.getMappings = getMappings;
        }
        // if this is a scheduled job being cloned
        // load the indices and types
        if($scope.mode === MODE.CLONE && $scope.ui.isScheduled) {
           // first load mappings, then extract types and fields.
          getMappings(setUpClonedJob);
        }
        $scope.getExampleTime();
      }

      function setUpClonedJob() {
        // when cloning a job the types from the selected indices haven't
        // been loaded. load these first and pass in fromClone=true so
        // the new types aren't ticked by default
        extractTypesFromIndices(true);

        // create $scope.types by looping through the type names
        // in the cloning job object,
        _.each($scope.schedulerConfig.types, function(t) {
          t = t.trim();
          $scope.types[t] = $scope.ui.types[t];
        });

        $scope.extractFields({types: $scope.types});

        // callback once fields have been loaded
        // when cloning an elastic search based job, the callback is to a function to detect custom influencers
        if($scope.dataLoadedCallback) {
          $scope.dataLoadedCallback();
        }
      }

      // quick function to get an array of type labels
      $scope.uiTypeKeys = function() {
        return Object.keys($scope.ui.types);
      };

      // function to delete an objects members
      // used rather than foo = {} as that destroys the reference in memory
      // $scope.properties is also bound to a different scope and references needs to
      // be retained
      function clear(obj) {
        Object.keys(obj).forEach(function(key) { delete obj[key]; });
        if(Array.isArray(obj)) {
          obj.length = 0;
        }
      }

      $scope.extractFields = function(typesIn) {
        // typesIn gets passed in when types checkboxes get toggled
        // use this list, or empty the list entirely
        if(typesIn && typesIn.hasOwnProperty("types")) {
          $scope.types = typesIn.types;
        } else {
          clear($scope.types);
        }

        // empty the full list of types if no types were passed in
        // so we can keep track of whether we've seen a type before and whether to add it to
        // the checkbox list pre-ticked
        if(typesIn === undefined) {
          clear($scope.ui.types);
        }

        clear($scope.properties);
        clear($scope.dateProperties);
        clear($scope.ui.influencers);
        $scope.ui.indexTextOk = false;

        extractTypesFromIndices();

        if($scope.uiTypeKeys().length) {
          // diplay a green tick for indices
          // diplay types selection
          $scope.ui.indexTextOk = true;
        }

        var ignoreFields = collectCopyToFields($scope.types);
        var flatFields = extractFlatFields($scope.types);
        _.each(flatFields, function(prop, key) {

          if (ignoreFields[key]) {
            return;
          }

          // add property (field) to list
          $scope.properties[key] = prop;
          if(prop.type === "date") {
            // add date field to list of date fields
            $scope.dateProperties[key] = prop;
          }
        });

        var keys = Object.keys($scope.types);
        $scope.ui.scheduler.typesText  = keys.join(", ");
        // $scope.ui.influencers = Object.keys($scope.properties);

        // influencers is an array of property names.
        // properties of a certain type (nonInfluencerTypes) are rejected.
        _.each($scope.properties, function(prop, key) {
          if(prop.type && !_.findWhere(nonInfluencerTypes, prop.type)) {
            $scope.ui.influencers.push(key);
          }
        });

        if($scope.mode === MODE.CLONE && $scope.ui.isScheduled) {
          // when cloning a scheduled job, don't initially detect the timeField or format
          // just rely on the incoming settings
        } else {
          guessTimeField();
        }
      };


      // create $scope.ui.types based on the indices selected
      // called when extracting fields and when cloning a job
      function extractTypesFromIndices(fromClone) {
        if($scope.ui.wizard.indexInputType === "TEXT") {
          clear($scope.indices);
          // parse comma separated list of indices
          var indices = $scope.ui.scheduler.indicesText.split(",");
          _.each(indices, function(ind) {
            ind = ind.trim();
            // catch wildcard text entry
            ind = ind.replace(/\*/g, ".+");
            var reg = new RegExp("^"+ind+"$");

            _.each($scope.ui.indices, function(index, key) {
              if(key.match(reg)) {
                $scope.indices[key] = index;
                _.each(index.types, function(type, i) {
                  if(!fromClone && $scope.ui.types[i] === undefined) {
                    // if we've never seen this type before add it to the ticked list
                    $scope.types[i] = type;
                  }
                  $scope.ui.types[i] = type;
                });
              }
            });
          });

        } else { // choose indices from tickbox list

          var keys = Object.keys($scope.indices);
          $scope.ui.scheduler.indicesText  = keys.join(", ");

          _.each($scope.indices, function(index) {
            _.each(index.types, function(type, i) {
              if(!fromClone && $scope.ui.types[i] === undefined) {
                // if we've never seen this type before add it to the ticked list
                $scope.types[i] = type;
              }
              $scope.ui.types[i] = type;
            });
          });
        }
      }

      $scope.getIndicesWithDelay = function () {
        $scope.ui.esServerOk = 2;
        window.clearTimeout(keyPressTimeout);
        keyPressTimeout = null;
        keyPressTimeout = window.setTimeout(function() {
          getMappings();
        }, 1000);
      };

      function getMappings(callback) {
        $scope.ui.validation.serverAuthenticationError = "";
        $scope.ui.validation.setTabValid(4, true);
        var url = $scope.ui.scheduler.baseUrlText;
        var username = $scope.ui.scheduler.usernameText;
        var password = $scope.ui.scheduler.passwordText;
        if(url.match(/^https?:\/\//)) {
          prlJobService.getESMappings(url, username, password).then(function(mappings) {
            $scope.ui.indices = mappings;
            $scope.ui.esServerOk = 1;
            console.log("getMappings():", $scope.ui.indices);

            if($scope.mode === MODE.CLONE) {
              setUpClonedJob();
            }

            // load the server version information and pass the callback through
            getServerInfo(callback);

          }).catch(function(err) {
            console.log("getMappings:", err);
            if(err.status) {
              if(err.status === 401) {
                $scope.ui.wizard.serverAuthenticated = true;
                $scope.ui.validation.serverAuthenticationError = "Username or password incorrect";
                $scope.ui.validation.setTabValid(4, false);
              } else if(err.status === 403) {
                $scope.ui.validation.serverAuthenticationError = err.reason;
                $scope.ui.validation.setTabValid(4, false);
              } else {
                clearMappings();
              }
              $scope.ui.esServerOk = -1;
            } else {
              clearMappings();
            }
          });
        } else {
          clearMappings();
        }

        function clearMappings() {
          $scope.ui.indices = [];
          $scope.ui.esServerOk = -1;
          $scope.ui.scheduler.typesText = "";
          $scope.ui.scheduler.indicesText = "";
        }
      }

      // load server version information
      // this gets called every time the mappings are loaded
      function getServerInfo(callback) {
        var url = $scope.ui.scheduler.baseUrlText;
        var username = $scope.ui.scheduler.usernameText;
        var password = $scope.ui.scheduler.passwordText;
        prlJobService.getESServerInfo(url, username, password).then(function(info) {
          $scope.serverInfo = info;
          setServerVersion(info);
          console.log("getServerInfo: ",info);
          if(callback) {
            callback();
          }
        })
        .catch(function(err) {
          console.log("getServerInfo: error loading ES server information", err);
          // default to 2.x version
          setServerVersion({version: { number: "2.x"}});
          if(callback) {
            callback();
          }
        });
      }

      // based on the ES server version, set the datasource
      function setServerVersion(info) {
        if(info && info.version && (typeof info.version.number === "string")) {
          var versionNumber = info.version.number.split(".");
          if(versionNumber[0] === "1") {
            $scope.ui.scheduler.dataSourceText = "ELASTICSEARCH_17X";
          } else {
            $scope.ui.scheduler.dataSourceText = "ELASTICSEARCH_2X";
          }
        }
      }

      $scope.toggleIndex = function(key, index) {
        var idx = $scope.indices[key];
        if(idx === undefined) {
          $scope.indices[key] = index;
        } else {
          delete $scope.indices[key];
        }

        $scope.extractFields();
        // console.log($scope.indices);
        guessTimeField();
      };

      $scope.toggleTypes = function(key, index) {
        var idx = $scope.types[key];
        if(idx === undefined) {
          $scope.types[key] = index;
        } else {
          delete $scope.types[key];
        }

        $scope.extractFields({types: $scope.types});
        // console.log($scope.types);
        guessTimeField();
      };

      $scope.toggleAllTypes = function() {
        // if all types are already selected, deselect all
        if($scope.allTypesSelected() ){
          clear($scope.types);
        } else {
          // otherwsise, select all
          $scope.uiTypeKeys().forEach(function(key) {
            $scope.types[key] = $scope.ui.types[key];
          });
        }

        // trigger field extraction and timeformat guessing
        $scope.extractFields({types: $scope.types});
        guessTimeField();
      };

      $scope.allTypesSelected = function() {
        return ($scope.uiTypeKeys().length === Object.keys($scope.types).length);
      };

      $scope.toggleAuthenticated = function() {
        $scope.ui.scheduler.usernameText = "";
        $scope.ui.scheduler.passwordText = "";
      };

      function collectCopyToFields(data) {
        var result = {};
        function recurse(node, name) {
          if (name === "copy_to") {
            if (Array.isArray(node)) {
              for (var p in node) {
                result[node[p]] = true;
              }
            } else {
              result[node] = true;
            }
          } else if (Object(node) === node || Array.isArray(node)) {
            for (var child in node) {
              recurse(node[child], child);
            }
          }
        }
        recurse(data, "");
        return result;
      }

      function extractFlatFields(types) {
        var result = {};
        var currentType;
        function recurse(node, name, parentNode, parentName) {
          if(node && node.type && typeof node.type === "string") {
            // node contains a type which is of type string
            node.__type = currentType;
            result[name] = node;
          } else if (Object(node) !== node) {
            // node is not an object, therefore must be a leaf
            // so add its parent to the result if the parent has a type of type string
            if(parentNode.type && typeof parentNode.type === "string") {
              parentNode.__type = currentType;
              result[parentName] = parentNode;
            }
          } else if (Array.isArray(node)) {
            // skip mapping array
            return;
          } else {
            var isEmpty = true;
            for (var field in node) {
              isEmpty = false;
              if (field === "properties") {
                // enter properties object, but don't add "properties" to the dot notation chain
                recurse(node[field], name, parentNode, parentName);
              } else {
                // enter object, building up a dot notation chain of names
                recurse(node[field], name ? name + "." + field : field, node, name);
              }
            }
            if (isEmpty && name) {
              result[name] = node;
            }
          }
        }
        _.each(types, function(type, i) {
          currentType = i;
          recurse(type, "", "");
        });
        return result;
      }

      function guessTimeField() {
        var match = $scope.dataDescription.timeField;
        if($scope.dateProperties[match] === undefined) {
          match = "";
        }
        _.each($scope.dateProperties, function(prop, i) {
          // loop through dateProperties and find the first item that matches "time"
          if(match === "" && i.match("time")) {
            match = i;
          }
        });
        if(match !== "") {
          $scope.dataDescription.timeField = match;
          $scope.guessTimeFormat();
          console.log("guessTimeField: guessed time fields: ", match);
        }
      }

      $scope.guessTimeFormat = function() {
        var index;
        if($scope.dateProperties[$scope.dataDescription.timeField] === undefined) {
          // if the selected timefield no longer exists in the dropdown
          // have a go at guessing it.
          guessTimeField();
          return;
        }

        // ensure we search for the correct type
        var type = $scope.dateProperties[$scope.dataDescription.timeField].__type;
        // ensure we search under the correct index
        _.each($scope.indices, function(ind, key) {
          if(ind) {
            _.each(ind.types, function(t, i) {
              if(i === type) {
                index = key;
              }
            });
          }
        });

        if(index && type) {
          // search for some times fields
          var url = $scope.ui.scheduler.baseUrlText;
          var username = $scope.ui.scheduler.usernameText;
          var password = $scope.ui.scheduler.passwordText;
          prlJobService.searchTimeFields(url, username, password, index, type, $scope.dataDescription.timeField)
            .then(function(resp) {
              $scope.dataDescription.timeFormat = stringUtils.guessTimeFormat(resp.time);
              console.log("guessTimeFormat: guessed time format: ", $scope.dataDescription.timeFormat);
              $scope.getExampleTime();
            })
            .catch(function(resp) {
              msgs.error("Error, time format could not be guessed.");
              msgs.error(resp.message);
              console.log("guessTimeFormat: times could not be loaded ", resp.message);
            });
          }
        };

      $scope.getExampleTime = function() {
        $scope.exampleTime = stringUtils.generateExampleTime($scope.dataDescription.timeFormat);
      };

      init();
    }
  };
}]);
