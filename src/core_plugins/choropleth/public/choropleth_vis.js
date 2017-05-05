import 'plugins/choropleth/choropleth.less';
import 'plugins/choropleth/choropleth_controller';
import 'plugins/choropleth/choropleth_vis_params';
import { TemplateVisTypeProvider } from 'ui/template_vis_type/template_vis_type';
import { VisSchemasProvider } from 'ui/vis/schemas';
import choroplethTemplate from 'plugins/choropleth/choropleth_controller.html';
import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { VisVisTypeProvider } from 'ui/vis/vis_type';
import { truncatedColorMaps } from 'ui/vislib/components/color/truncated_colormaps';

VisTypesRegistryProvider.register(function ChoroplethProvider(Private, vectormapsConfig) {

  const VisType = Private(VisVisTypeProvider);
  const TemplateVisType = Private(TemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  const vectorLayers = vectormapsConfig.layers.slice();
  const selectedLayer = vectorLayers[0];
  const selectedJoinField = selectedLayer ? vectorLayers[0].fields[0] : null;

  return new TemplateVisType({
    name: 'choropleth',
    title: 'Region Map',
    implementsRenderComplete: true,
    description: 'Show metrics on a thematic map. Use one of the provide base maps, or add your own. ' +
    'Darker colors represent higher values.',
    category: VisType.CATEGORY.MAP,
    icon: 'fa-globe',
    template: choroplethTemplate,
    params: {
      defaults: {
        legendPosition: 'bottomright',
        addTooltip: true,
        colorSchema: 'Yellow to Red',
        selectedLayer: selectedLayer,
        selectedJoinField: selectedJoinField
      },
      legendPositions: [{
        value: 'bottomleft',
        text: 'bottom left',
      }, {
        value: 'bottomright',
        text: 'bottom right',
      }, {
        value: 'topleft',
        text: 'top left',
      }, {
        value: 'topright',
        text: 'top right',
      }],
      colorSchemas: Object.keys(truncatedColorMaps),
      vectorLayers: vectorLayers,
      editor: '<choropleth-vis-params></choropleth-vis-params>'
    },
    schemas: new Schemas([
      {
        group: 'metrics',
        name: 'metric',
        title: 'Value',
        min: 1,
        max: 1,
        aggFilter: ['count', 'avg', 'sum', 'min', 'max', 'cardinality', 'top_hits'],
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


