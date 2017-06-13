import routes from 'ui/routes';
import { Notifier } from 'ui/notify/notifier';
import template from './pipeline_edit_route.html';
import 'plugins/logstash/services/pipeline';
import './components/pipeline_edit';
import { updateLogstashSections } from 'plugins/logstash/lib/update_management_sections';
import { Pipeline } from 'plugins/logstash/models/pipeline';

routes
.when('/management/logstash/pipelines/pipeline/:id/edit')
.when('/management/logstash/pipelines/new-pipeline')
.defaults(/management\/logstash\/pipelines\/(new-pipeline|pipeline\/:id\/edit)/, {
  template: template,
  controller: class PipelineEditRouteController {
    constructor($injector) {
      const $route = $injector.get('$route');
      this.pipeline = $route.current.locals.pipeline;
    }
  },
  controllerAs: 'pipelineEditRoute',
  resolve: {
    logstashTabs: ($injector) => {
      const $route = $injector.get('$route');
      const pipelineId = $route.current.params.id;
      updateLogstashSections(pipelineId);
    },
    pipeline: function ($injector) {
      const $route = $injector.get('$route');
      const pipelineService = $injector.get('pipelineService');
      const notifier = new Notifier({ location: 'Logstash' });

      const pipelineId = $route.current.params.id;

      if (!pipelineId) return new Pipeline();

      return pipelineService.loadPipeline(pipelineId)
      .catch(notifier.error);
    }
  }
});

routes
.when('/management/logstash/pipelines/pipeline/:id', {
  redirectTo: '/management/logstash/pipelines/pipeline/:id/edit'
});
