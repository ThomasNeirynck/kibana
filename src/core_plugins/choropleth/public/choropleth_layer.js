import $ from 'jquery';
import L from 'leaflet';
import _ from 'lodash';
import d3 from 'd3';
import KibanaMapLayer from 'ui/vis_maps/kibana_map_layer';
import colorramps from 'ui/vislib/components/color/colormaps';

export default class ChoroplethLayer extends KibanaMapLayer {

  constructor(geojsonUrl) {
    super();

    this._metrics = null;
    this._joinField = null;
    this._colorRamp = colorramps['Yellow to Red'];
    this._tooltipFormatter = x => '';

    this._geojsonUrl = geojsonUrl;
    this._leafletLayer = L.geoJson(null, {
      onEachFeature: (feature, layer) => {
        layer.on('click', () => {
          this.emit('select', feature.properties[this._joinField]);
        });
        let location = null;
        const popup = layer.on({
          mouseover: (event) => {

            const tooltipContents = this._tooltipFormatter(feature);
            if (!location) {
              const leafletGeojon = L.geoJson(feature);
              location = leafletGeojon.getBounds().getCenter();
            }

            this.emit('showTooltip', {
              content: tooltipContents,
              position: location
            });
          },
          mouseout: () => {
            this.emit('hideTooltip');
          }
        });
      },
      style: emptyStyle
    });

    this._loaded = false;
    $.ajax({//todo: replace with es6 fetch
      dataType: 'json',
      url: geojsonUrl,
      success: (data) => {
        this._leafletLayer.addData(data);
        this._loaded = true;
        this._setStyle();
      }
    }).error(function (e) {
      // notifier.fatal(e);
      // console.error(e);
    });
  }

  _setStyle() {
    if (!this._loaded || !this._metrics || !this._joinField) {
      return;
    }


    const styleFunction = makeChoroplethStyleFunction(this._metrics, this._colorRamp, this._joinField);
    this._leafletLayer.setStyle(styleFunction);


    if (this._metrics && this._metrics.length > 0) {
      const { min, max } = getMinMax(this._metrics);
      this._legendColors = getLegendColors(this._colorRamp);
      const quantizeDomain = (min !== max) ? [min, max] : d3.scale.quantize().domain();
      this._legendQuantizer = d3.scale.quantize().domain(quantizeDomain).range(this._legendColors);
    }
    this.emit('styleChanged');
  }

  getMetrics() {
    return this._metrics;
  }

  getMetricsAgg() {
    return this._metricsAgg;
  }

  getUrl() {
    return this._geojsonUrl;
  }

  setTooltipFormatter(tooltipFormatter, metricsAgg, fieldName) {
    this._tooltipFormatter = (geojsonFeature) => {
      if (!this._metrics) {
        return '';
      }
      const match = this._metrics.find((bucket) => {
        return bucket.term === geojsonFeature.properties[this._joinField];
      });
      return tooltipFormatter(metricsAgg, match, fieldName);
    };
  }

  setJoinField(joinfield) {
    if (joinfield === this._joinField) {
      return;
    }
    this._joinField = joinfield;
    this._setStyle();
  }


  setMetrics(metrics, metricsAgg) {
    this._metrics = metrics;
    this._metricsAgg = metricsAgg;
    this._valueFormatter = this._metricsAgg.fieldFormatter();
    this._setStyle();
  }

  setColorRamp(colorRamp) {
    if (_.isEqual(colorRamp, this._colorRamp)) {
      return;
    }
    this._colorRamp = colorRamp;
    this._setStyle();
  }

  equalsGeoJsonUrl(geojsonUrl) {
    return this._geojsonUrl === geojsonUrl;
  }

  appendLegendContents(jqueryDiv) {


    if (!this._legendColors || !this._legendQuantizer || !this._metricsAgg) {
      return;
    }

    const titleText = this._metricsAgg.makeLabel();
    // const titleText = 'foobar';
    const $title = $('<div>').addClass('tilemap-legend-title').text(titleText);
    jqueryDiv.append($title);

    this._legendColors.forEach((color) => {

      const labelText = this._legendQuantizer
        .invertExtent(color)
        .map(this._valueFormatter)
        .join(' – ');

      const label = $('<div>');
      const icon = $('<i>').css({
        background: color,
        'border-color': makeColorDarker(color)
      });

      const text = $('<span>').text(labelText);
      label.append(icon);
      label.append(text);

      jqueryDiv.append(label);
    });

  }

}


function makeColorDarker(color) {
  const amount = 1.3;//magic number, carry over from earlier
  return d3.hcl(color).darker(amount).toString();
}


function getMinMax(data) {
  let min = data[0].value;
  let max = data[0].value;
  for (let i = 1; i < data.length; i += 1) {
    min = Math.min(data[i].value, min);
    max = Math.max(data[i].value, max);
  }
  return { min, max };
}


function makeChoroplethStyleFunction(data, colorramp, joinField) {

  if (data.length === 0) {
    return function () {
      return emptyStyle();
    };
  }

  const { min, max } = getMinMax(data);

  return function (geojsonFeature) {

    const match = data.find((bucket) => {
      return bucket.term === geojsonFeature.properties[joinField];
    });

    if (!match) {
      return emptyStyle();
    }

    return {
      fillColor: getChoroplethColor(match.value, min, max, colorramp),
      weight: 2,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  };
  // const quantizeDomain = (min !== max) ? [min, max] : d3.scale.quantize().domain();
  // const legendQuantizer = d3.scale.quantize().domain(quantizeDomain).range(colorramp);

  // return {
  //   styleFunction: styleFunction,
  //   legendQuantizer: legendQuantizer
  // };
}


function getLegendColors(colorRamp) {

  const colors = [];
  colors[0] = getColor(colorRamp, 0);
  colors[1] = getColor(colorRamp, Math.floor(colorRamp.length * 1 / 4));
  colors[2] = getColor(colorRamp, Math.floor(colorRamp.length * 2 / 4));
  colors[3] = getColor(colorRamp, Math.floor(colorRamp.length * 3 / 4));
  colors[4] = getColor(colorRamp, colorRamp.length - 1);
  return colors;
}

function getColor(colorRamp, i) {

  if (!colorRamp[i]) {
    return getColor();
  }

  const color = colorRamp[i][1];
  const red = Math.floor(color[0] * 255);
  const green = Math.floor(color[1] * 255);
  const blue = Math.floor(color[2] * 255);
  return `rgb(${red},${green},${blue})`;
}


function getChoroplethColor(value, min, max, colorRamp) {
  if (min === max) {
    return getColor(colorRamp, colorRamp.length - 1);
  }
  const fraction = (value - min) / (max - min);
  const index = Math.round(colorRamp.length * fraction) - 1;
  const i = Math.max(Math.min(colorRamp.length - 1, index), 0);

  return getColor(colorRamp, i);
}

const emptyStyleObject = {
  weight: 1,
  opacity: 0.6,
  color: 'rgb(200,200,200)',
  fillOpacity: 0
};
function emptyStyle() {
  return emptyStyleObject;
}

