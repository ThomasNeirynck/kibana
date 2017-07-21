import { uiModules } from 'ui/modules';
import { WatchActionControllerBase } from '../lib/watch_action_controller_base';
import template from './watch_slack_action.html';
import 'ui/directives/input_focus';
import 'plugins/watcher/services/html_id_generator';

const app = uiModules.get('xpack/watcher');

app.directive('watchSlackAction', function ($injector) {
  const htmlIdGeneratorFactory = $injector.get('xpackWatcherHtmlIdGeneratorFactory');

  return {
    restrict: 'E',
    template: template,
    bindToController: true,
    controllerAs: 'watchSlackAction',
    controller: class WatchSlackActionController extends WatchActionControllerBase {
      constructor($scope) {
        super($scope);

        this.makeId = htmlIdGeneratorFactory.create(this.action.id);

        this.to = this.action.to.join(', ');

        $scope.$watch('watchSlackAction.to', (toList) => {
          const toArray = (toList || '').split(',').map(to => to.trim());
          this.to = toArray.join(', ');

          this.action.to = toArray;
        });

        $scope.$watchGroup([
          'action.to',
          'action.text'
        ], () => { this.onChange(this.action); });
      }
    }
  };
});
