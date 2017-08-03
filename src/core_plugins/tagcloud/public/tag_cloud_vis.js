import 'plugins/tagcloud/tag_cloud.less';
import 'plugins/tagcloud/tag_cloud_controller';
import 'plugins/tagcloud/tag_cloud_vis_params';
import { VisFactoryProvider } from 'ui/vis/vis_factory';
import { CATEGORY } from 'ui/vis/vis_category';
import { VisSchemasProvider } from 'ui/vis/editors/default/schemas';
import tagCloudTemplate from 'plugins/tagcloud/tag_cloud_controller.html';
import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import image from './images/icon-tagcloud.svg';
import { AggTypesIndexProvider } from 'ui/agg_types';
import { AggregationsProvider } from 'ui/vis/aggregations';

VisTypesRegistryProvider.register(function TagCloudProvider(Private) {
  const VisFactory = Private(VisFactoryProvider);
  const Schemas = Private(VisSchemasProvider);
  const AggTypes = Private(AggTypesIndexProvider);
  const AGGREGATIONS = Private(AggregationsProvider);

  return VisFactory.createAngularVisualization({
    name: 'tagcloud',
    title: 'Tag Cloud',
    image,
    description: 'A group of words, sized according to their importance',
    category: CATEGORY.OTHER,
    visConfig: {
      defaults: {
        scale: 'linear',
        orientation: 'single',
        minFontSize: 18,
        maxFontSize: 72
      },
      template: tagCloudTemplate,
    },
    responseHandler: 'none',
    editorConfig: {
      collections: {
        scales: ['linear', 'log', 'square root'],
        orientations: ['single', 'right angled', 'multiple'],
      },
      optionsTemplate: '<tagcloud-vis-params></tagcloud-vis-params>',
      schemas: new Schemas([
        {
          group: 'metrics',
          name: 'metric',
          title: 'Tag Size',
          min: 1,
          max: 1,
          aggFilter: AGGREGATIONS.SIMPLE_MAPPABLE_METRICS,
          defaults: [
            { schema: 'metric', type: AggTypes.byName.count.name }
          ]
        },
        {
          group: 'buckets',
          name: 'segment',
          icon: 'fa fa-cloud',
          title: 'Tags',
          min: 1,
          max: 1,
          aggFilter: [AggTypes.byName.terms.name]
        }
      ])
    }
  });
});


