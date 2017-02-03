import 'plugins/choropleth/choropleth.less';
import 'plugins/choropleth/choropleth_controller';
import 'plugins/choropleth/choropleth_vis_params';
import TemplateVisTypeTemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';
import choroplethTemplate from 'plugins/choropleth/choropleth_controller.html';
import visTypes from 'ui/registry/vis_types';
import colorramps from 'ui/vislib/components/color/colormaps';

visTypes.register(function ChoroplethProvider(Private) {
  const TemplateVisType = Private(TemplateVisTypeTemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  return new TemplateVisType({
    name: 'choropleth',
    title: 'Vector Maps',
    implementsRenderComplete: true,
    description: 'Show thematic data on a map',
    icon: 'fa-globe',
    template: choroplethTemplate,
    params: {
      defaults: {
        colorSchema: 'Yellow to Red'
      },
      colorSchemas: Object.keys(colorramps),
      editor: '<choropleth-vis-params></choropleth-vis-params>'
    },
    schemas: new Schemas([
      {
        group: 'metrics',
        name: 'metric',
        title: '',
        min: 1,
        max: 1,
        aggFilter: ['!std_dev', '!percentiles', '!percentile_ranks'],
        defaults: [
          { schema: 'metric', type: 'count' }
        ]
      },
      {
        group: 'buckets',
        name: 'segment',
        icon: 'fa fa-globe',
        title: 'shape field',
        min: 1,
        max: 1,
        aggFilter: ['terms']
      }
    ])
  });
});


