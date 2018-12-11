/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import _ from 'lodash';
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import {
  EuiFormRow,
  EuiComboBox
} from '@elastic/eui';
import { IndexPatternSelect } from 'ui/index_patterns/components/index_pattern_select';
import { SingleFieldSelect } from '../../components/single_field_select';
import { VectorSource } from './vector_source';
import { GeohashGridLayer } from '../geohashgrid_layer';
import { VectorLayer } from '../vector_layer';
import { Schemas } from 'ui/vis/editors/default/schemas';
import {
  indexPatternService,
  fetchSearchSourceAndRecordWithInspector,
  SearchSource,
  timeService,
} from '../../../kibana_services';
import { createExtentFilter, makeGeohashGridPolygon } from '../../../elasticsearch_geo_utils';
import { AggConfigs } from 'ui/vis/agg_configs';
import { tabifyAggResponse } from 'ui/agg_response/tabify';
import { convertToGeoJson } from 'ui/vis/map/convert_to_geojson';
import { ESSourceDetails } from './es_geohashgrid_sourcedetails';
import { ZOOM_TO_PRECISION } from '../../utils/zoom_to_precision';
import { VectorStyle } from '../styles/vector_style';

const aggSchemas = new Schemas([
  {
    group: 'metrics',
    name: 'metric',
    title: 'Value',
    min: 1,
    max: 1,  // TODO add support for multiple metric aggregations - convertToGeoJson will need to be tweeked
    aggFilter: ['count', 'avg', 'sum', 'min', 'max', 'cardinality', 'top_hits'],
    defaults: [
      { schema: 'metric', type: 'count' }
    ]
  },
  {
    group: 'buckets',
    name: 'segment',
    title: 'Geo Coordinates',
    aggFilter: 'geohash_grid',
    min: 1,
    max: 1
  }
]);

const REQUEST_TYPE =  {
  AS_CENTROID_HEATMAP: 'AS_CENTROID_HEATMAP',
  AS_CENTROID_POINT: 'AS_CENTROID_POINT',
  AS_GEOHASHGRID_POLYGON: 'AS_CENTROID_POLYGON',
};

export class ESGeohashGridSource extends VectorSource {

  static type = 'ES_GEOHASH_GRID';
  static typeDisplayName = 'Elasticsearch geohash aggregation';

  static createDescriptor({ indexPatternId, geoField, requestType }) {
    return {
      type: ESGeohashGridSource.type,
      indexPatternId: indexPatternId,
      geoField: geoField,
      requestType: requestType
    };
  }

  static renderEditor({ onPreviewSource }) {
    const onSelect = (sourceConfig) => {
      const sourceDescriptor = ESGeohashGridSource.createDescriptor(sourceConfig);
      const source = new ESGeohashGridSource(sourceDescriptor);
      onPreviewSource(source);
    };

    return (<Editor onSelect={onSelect}/>);
  }

  renderDetails() {
    return (
      <ESSourceDetails
        source={this}
        geoField={this._descriptor.geoField}
        geoFieldType="Point field"
        sourceType={ESGeohashGridSource.typeDisplayName}
      />
    );
  }


  async getGeoJsonWithMeta({ layerId, layerName }, searchFilters) {

    let targetPrecision = ZOOM_TO_PRECISION[Math.round(searchFilters.zoom)];
    targetPrecision += 0;//should have refinement param, similar to heatmap style
    const featureCollection = await this.getGeoJsonPointsWithTotalCount({
      precision: targetPrecision,
      extent: searchFilters.buffer,
      timeFilters: searchFilters.timeFilters,
      layerId: layerId,
      layerName: layerName
    });

    if (this._descriptor.requestType === REQUEST_TYPE.AS_GEOHASHGRID_POLYGON) {
      featureCollection.features.forEach((feature) => {
        //replace geometries with the polygon
        feature.geometry = makeGeohashGridPolygon(feature);
      });
    }

    featureCollection.features.forEach((feature) => {
      //give this some meaningful name
      feature.properties.doc_count = feature.properties.value;
      delete feature.properties.value;
    });

    return {
      data: featureCollection,
      meta: {
        areResultsTrimmed: true
      }
    };

  }

  async getNumberFields() {
    return ['doc_count'];
  }


  async getGeoJsonPointsWithTotalCount({ precision, extent, timeFilters, layerId, layerName }) {

    let indexPattern;
    try {
      indexPattern = await indexPatternService.get(this._descriptor.indexPatternId);
    } catch (error) {
      throw new Error(`Unable to find Index pattern ${this._descriptor.indexPatternId}`);
    }

    const geoField = indexPattern.fields.byName[this._descriptor.geoField];
    if (!geoField) {
      throw new Error(`Index pattern ${indexPattern.title} no longer contains the geo field ${this._descriptor.geoField}`);
    }

    const aggConfigs = new AggConfigs(indexPattern, this._makeAggConfigs(precision), aggSchemas.all);

    let resp;
    try {
      const searchSource = new SearchSource();
      searchSource.setField('index', indexPattern);
      searchSource.setField('size', 0);
      searchSource.setField('aggs', aggConfigs.toDsl());
      searchSource.setField('filter', () => {
        const filters = [];
        filters.push(createExtentFilter(extent, geoField.name, geoField.type));
        filters.push(timeService.createFilter(indexPattern, timeFilters));
        return filters;
      });

      resp = await fetchSearchSourceAndRecordWithInspector({
        searchSource,
        requestName: layerName,
        requestId: layerId,
        requestDesc: 'Elasticsearch geohash_grid aggregation request'
      });
    } catch(error) {
      throw new Error(`Elasticsearch search request failed, error: ${error.message}`);
    }

    const tabifiedResp = tabifyAggResponse(aggConfigs, resp);
    const { featureCollection } = convertToGeoJson(tabifiedResp);

    return featureCollection;
  }

  async isTimeAware() {
    const indexPattern = await this._getIndexPattern();
    const timeField = indexPattern.timeFieldName;
    return !!timeField;
  }

  isFilterByMapBounds() {
    return true;
  }

  async _getIndexPattern() {
    let indexPattern;
    try {
      indexPattern = await indexPatternService.get(this._descriptor.indexPatternId);
    } catch (error) {
      throw new Error(`Unable to find Index pattern ${this._descriptor.indexPatternId}`);
    }
    return indexPattern;
  }

  _makeAggConfigs(precision) {
    return [
      // TODO allow user to configure metric(s) aggregations
      {
        id: '1',
        enabled: true,
        type: 'count',
        schema: 'metric',
        params: {}
      },
      {
        id: '2',
        enabled: true,
        type: 'geohash_grid',
        schema: 'segment',
        params: {
          field: this._descriptor.geoField,
          isFilteredByCollar: false, // map extent filter is in query so no need to filter in aggregation
          useGeocentroid: true, // TODO make configurable
          autoPrecision: false, // false so we can define our own precision levels based on styling
          precision: precision,
        }
      }
    ];
  }

  _createDefaultLayerDescriptor(options) {

    if (this._descriptor.requestType === REQUEST_TYPE.AS_CENTROID_HEATMAP) {
      return GeohashGridLayer.createDescriptor({
        sourceDescriptor: this._descriptor,
        ...options
      });
    }

    const descriptor = VectorLayer.createDescriptor({
      sourceDescriptor: this._descriptor,
      ...options
    });
    descriptor.style = {
      ...descriptor.style,
      "type": "VECTOR",
      "properties": {
        "fillColor": {
          "type": "DYNAMIC",
          "options": {
            "field": {
              "label": "doc_count",
              "name": "doc_count",
              "origin": "source"
            },
            "color": "Blues"
          }
        },
        "iconSize": {
          "type": "STATIC",
          "options": {
            "size": 10
          }
        },
        "alphaValue": 0.5
      }
    };
    return descriptor;

  }

  createDefaultLayer(options) {

    if (this._descriptor.requestType === REQUEST_TYPE.AS_CENTROID_HEATMAP) {
      return new GeohashGridLayer({
        layerDescriptor: this._createDefaultLayerDescriptor(options),
        source: this
      });
    }

    const layerDescriptor = this._createDefaultLayerDescriptor(options);
    const style = new VectorStyle(layerDescriptor.style);
    return new VectorLayer({
      layerDescriptor: layerDescriptor,
      source: this,
      style: style
    });

  }


  async getDisplayName() {
    const indexPattern = await this._getIndexPattern();
    return indexPattern.title;
  }
}

class Editor extends React.Component {

  static propTypes = {
    onSelect: PropTypes.func.isRequired,
  };

  static _filterGeoField = (field) => {
    return ['geo_point'].includes(field.type);
  };

  constructor() {
    super();

    this._requestTypeOptions =   [{
      label: 'heatmap',
      value: REQUEST_TYPE.AS_CENTROID_HEATMAP
    }, {
      label: 'points',
      value: REQUEST_TYPE.AS_CENTROID_POINT
    },
    {
      label: 'grid rectangles',
      value: REQUEST_TYPE.AS_GEOHASHGRID_POLYGON
    }
    ];

    this.state = {
      isLoadingIndexPattern: false,
      indexPatternId: '',
      geoField: '',
      requestType: this._requestTypeOptions[0]
    };
  }


  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    this.loadIndexPattern(this.state.indexPatternId);
  }

  onIndexPatternSelect = (indexPatternId) => {
    this.setState({
      indexPatternId,
    }, this.loadIndexPattern(indexPatternId));
  };

  loadIndexPattern = (indexPatternId) => {
    this.setState({
      isLoadingIndexPattern: true,
      indexPattern: undefined,
      geoField: undefined,
    }, this.debouncedLoad.bind(null, indexPatternId));
  };

  debouncedLoad = _.debounce(async (indexPatternId) => {
    if (!indexPatternId || indexPatternId.length === 0) {
      return;
    }

    let indexPattern;
    try {
      indexPattern = await indexPatternService.get(indexPatternId);
    } catch (err) {
      // index pattern no longer exists
      return;
    }

    if (!this._isMounted) {
      return;
    }

    // props.indexPatternId may be updated before getIndexPattern returns
    // ignore response when fetched index pattern does not match active index pattern
    if (indexPattern.id !== indexPatternId) {
      return;
    }

    this.setState({
      isLoadingIndexPattern: false,
      indexPattern: indexPattern
    });

    //make default selection
    const geoFields = indexPattern.fields.filter(Editor._filterGeoField);
    if (geoFields[0]) {
      this._onGeoFieldSelect(geoFields[0].name);
    }

  }, 300);

  _onGeoFieldSelect = (geoField) => {
    this.setState({
      geoField
    }, this.previewLayer);
  };

  _onRequestTypeSelect =  (selectedOptions) => {
    this.setState({
      requestType: selectedOptions[0]
    }, this.previewLayer);
  };


  previewLayer = () => {
    const {
      indexPatternId,
      geoField,
      requestType
    } = this.state;
    if (indexPatternId && geoField) {
      this.props.onSelect({
        indexPatternId,
        geoField,
        requestType: requestType.value
      });
    }
  };

  _renderGeoSelect() {
    if (!this.state.indexPattern) {
      return null;
    }

    return (
      <EuiFormRow label="Geospatial field">
        <SingleFieldSelect
          placeholder="Select geo field"
          value={this.state.geoField}
          onChange={this._onGeoFieldSelect}
          filterField={Editor._filterGeoField}
          fields={this.state.indexPattern ? this.state.indexPattern.fields : undefined}
        />
      </EuiFormRow>
    );
  }

  _renderLayerSelect() {
    return (
      <EuiFormRow label="Show as">
        <EuiComboBox
          placeholder="Select a single option"
          singleSelection={{ asPlainText: true }}
          options={this._requestTypeOptions}
          selectedOptions={[this.state.requestType]}
          onChange={this._onRequestTypeSelect}
          isClearable={false}
        />
      </EuiFormRow>);
  }

  _renderIndexPatternSelect() {
    return (
      <EuiFormRow label="Index pattern">
        <IndexPatternSelect
          indexPatternId={this.state.indexPatternId}
          onChange={this.onIndexPatternSelect}
          placeholder="Select index pattern"
          fieldTypes={['geo_point']}
        />
      </EuiFormRow>
    );
  }


  render() {
    return (
      <Fragment>
        {this._renderIndexPatternSelect()}
        {this._renderGeoSelect()}
        {this._renderLayerSelect()}
      </Fragment>
    );
  }
}
