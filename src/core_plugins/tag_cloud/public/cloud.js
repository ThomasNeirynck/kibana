import 'plugins/tagcloud/cloud.less';
import 'plugins/tagcloud/cloud_controller.js';
import 'plugins/tagcloud/cloud_directive.js';
import TemplateVisTypeTemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';
import tagCloudTemplate from 'plugins/tagcloud/cloud.html';
import tagCloudVisParamsTemplate from 'plugins/tagcloud/cloud_vis_params.html';
import visTypes from 'ui/registry/vis_types';

visTypes.register(function TagCloudProvider(Private) {
  const TemplateVisType = Private(TemplateVisTypeTemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  return new TemplateVisType({
    name: 'tagcloud',
    title: 'Tag cloud',
    description: 'A tag cloud visualization is a visual representation of text data, ' +
    'typically used to visualize free form text. Tags are usually single words, ' +
    'and the importance of each tag is shown with font size or color.',
    icon: 'fa-cloud',
    template: tagCloudTemplate,
    params: {
      defaults: {
        textScale: 'linear',
        orientations: 'single',
        fontStyle: 'normal',
        fontWeight: 'normal',
        minFontSize: 18,
        maxFontSize: 72
      },
      editor: tagCloudVisParamsTemplate
    },
    schemas: new Schemas([
      {
        group: 'metrics',
        name: 'metric',
        title: 'Tag Size',
        min: 1,
        max: 1,
        aggFilter: ['avg', 'sum', 'count', 'min', 'max', 'median', 'cardinality'],
        defaults: [
          { schema: 'metric', type: 'count' }
        ]
      },
      {
        group: 'buckets',
        name: 'segment',
        icon: 'fa fa-cloud',
        title: 'Tags',
        min: 1,
        max: 1,
        aggFilter: ['terms', 'significant_terms']
      }
    ])
  });
});


