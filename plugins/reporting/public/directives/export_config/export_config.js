import angular from 'angular';
import { debounce } from 'lodash';
import 'plugins/reporting/services/document_control';
import 'plugins/reporting/services/export_types';
import './export_config.less';
import template from 'plugins/reporting/directives/export_config/export_config.html';
import { Notifier } from 'ui/notify/notifier';
import { uiModules } from 'ui/modules';
import { stateMonitorFactory } from 'ui/state_management/state_monitor_factory';
import url from 'url';

const module = uiModules.get('xpack/reporting');

module.directive('exportConfig', ($rootScope, reportingDocumentControl, reportingExportTypes, $location, $compile) => {
  const reportingNotifier = new Notifier({ location: 'Reporting' });

  const createAbsoluteUrl = relativePath => {
    return url.resolve($location.absUrl(), relativePath);
  };

  return {
    restrict: 'E',
    scope: {},
    require: ['?^dashboardApp', '?^visualizeApp', '?^discoverApp'],
    controllerAs: 'exportConfig',
    template,
    transclude: true,
    async link($scope, $el, $attr, controllers) {
      const actualControllers = controllers.filter(c => c !== null);
      if (actualControllers.length !== 1) {
        throw new Error(`Expected there to be 1 controller, but there are ${actualControllers.length}`);
      }
      const controller = actualControllers[0];
      $scope.exportConfig.isDirty = () => controller.appStatus.dirty;
      if (controller.appStatus.dirty) {
        return;
      }

      const exportTypeId = $attr.enabledExportType;
      $scope.exportConfig.exportType = reportingExportTypes.getById(exportTypeId);
      $scope.exportConfig.objectType = $attr.objectType;

      $scope.options = {};
      if ($scope.exportConfig.exportType.optionsTemplate) {
        $el.find('.options').append($compile($scope.exportConfig.exportType.optionsTemplate)($scope));
      }

      $scope.getRelativePath = (options) => {
        return reportingDocumentControl.getPath($scope.exportConfig.exportType, controller, options || $scope.options);
      };

      $scope.updateUrl = (options) => {
        return $scope.getRelativePath(options)
        .then(relativePath => {
          $scope.exportConfig.absoluteUrl = createAbsoluteUrl(relativePath);
        });
      };

      $scope.$watch('options', newOptions => $scope.updateUrl(newOptions), true);

      await $scope.updateUrl();
    },
    controller($scope, $document, $window, $timeout, globalState) {
      const stateMonitor = stateMonitorFactory.create(globalState);
      stateMonitor.onChange(() => {
        if ($scope.exportConfig.isDirty()) {
          return;
        }

        this.updateUrl();
      });

      const onResize = debounce(() => {
        $scope.updateUrl();
      }, 200);

      angular.element($window).on('resize', onResize);
      $scope.$on('$destroy', () => {
        angular.element($window).off('resize', onResize);
        stateMonitor.destroy();
      });

      this.export = () => {
        return $scope.getRelativePath()
        .then(relativePath => {
          return reportingDocumentControl.create(relativePath);
        })
        .then(() => {
          reportingNotifier.info(`${this.objectType} generation has been queued. You can track its progress under Management.`);
        })
        .catch((err) => {
          if (err.message === 'not exportable') {
            return reportingNotifier.warning('Only saved dashboards can be exported. Please save your work first.');
          }

          reportingNotifier.error(err);
        });
      };

      this.copyToClipboard = selector => {
        // updating the URL in the input because it could have potentially changed and we missed the update
        $scope.updateUrl()
          .then(() => {

            // we're using $timeout to make sure the URL has been updated in the HTML as this is where
            // we're copying the ext from
            $timeout(() => {
              const copyTextarea = $document.find(selector)[0];
              copyTextarea.select();

              try {
                const isCopied = document.execCommand('copy');
                if (isCopied) {
                  reportingNotifier.info('URL copied to clipboard.');
                } else {
                  reportingNotifier.info('URL selected. Press Ctrl+C to copy.');
                }
              } catch (err) {
                reportingNotifier.info('URL selected. Press Ctrl+C to copy.');
              }
            });
          });
      };
    }
  };
});
