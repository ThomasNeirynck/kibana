/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { ES_GEO_FIELD_TYPE, SCALING_TYPES } from '../../../../common/constants';

jest.mock('../../../kibana_services');
jest.mock('ui/new_platform');
jest.mock('./load_index_settings');

import { getIndexPatternService, getSearchService, getHttp } from '../../../kibana_services';

import { loadIndexSettings } from './load_index_settings';

import { ESSearchSource } from './es_search_source';
import { MapFilters } from '../../../../common/descriptor_types';

describe('ESSearchSource', () => {
  it('constructor', () => {
    const esSearchSource = new ESSearchSource({}, null);
    expect(esSearchSource instanceof ESSearchSource).toBe(true);
  });

  describe('ITiledSingleLayerVectorSource', () => {
    it('mb-source params', () => {
      const esSearchSource = new ESSearchSource({}, null);
      expect(esSearchSource.getMinZoom()).toBe(0);
      expect(esSearchSource.getMaxZoom()).toBe(24);
      expect(esSearchSource.getLayerName()).toBe('source_layer');
    });

    describe('getUrlTemplateWithMeta', () => {
      const geoFieldName = 'bar';
      const mockIndexPatternService = {
        get() {
          return {
            title: 'foobar-title-*',
            fields: {
              getByName() {
                return {
                  name: geoFieldName,
                  type: ES_GEO_FIELD_TYPE.GEO_SHAPE,
                };
              },
            },
          };
        },
      };

      beforeEach(async () => {
        const mockSearchSource = {
          setField: jest.fn(),
          getSearchRequestBody() {
            return { foobar: 'ES_DSL_PLACEHOLDER', params: this.setField.mock.calls };
          },
        };
        const mockSearchService = {
          searchSource: {
            async create() {
              return mockSearchSource as SearchSource;
            },
          },
        };

        // @ts-expect-error
        getIndexPatternService.mockReturnValue(mockIndexPatternService);
        // @ts-expect-error
        getSearchService.mockReturnValue(mockSearchService);
        // @ts-expect-error
        loadIndexSettings.mockReturnValue({
          maxResultWindow: 1000,
        });
        // @ts-expect-error
        getHttp.mockReturnValue({
          basePath: {
            prepend(path) {
              return `rootdir${path};`;
            },
          },
        });
      });

      const searchFilters: MapFilters = {
        filters: [],
        fieldNames: ['tooltipField', 'styleField'],
      };

      it('Should only include required props', async () => {
        const esSearchSource = new ESSearchSource(
          { geoField: geoFieldName, indexPatternId: 'ipId' },
          null
        );
        const urlTemplateWithMeta = await esSearchSource.getUrlTemplateWithMeta(searchFilters);
        expect(urlTemplateWithMeta.urlTemplate).toBe(
          `rootdir/api/maps/mvt/getTile;?x={x}&y={y}&z={z}&geometryFieldName=bar&index=foobar-title-*&requestBody=(foobar:ES_DSL_PLACEHOLDER,params:('0':('0':index,'1':(fields:(),title:'foobar-title-*')),'1':('0':size,'1':1000),'2':('0':filter,'1':!()),'3':('0':query),'4':('0':fields,'1':!(tooltipField,styleField)),'5':('0':source,'1':!(tooltipField,styleField))))`
        );
      });
    });
  });

  describe('isFilterByMapBounds', () => {
    it('default', () => {
      const esSearchSource = new ESSearchSource({}, null);
      expect(esSearchSource.isFilterByMapBounds()).toBe(true);
    });
    it('mvt', () => {
      const esSearchSource = new ESSearchSource({ scalingType: SCALING_TYPES.MVT }, null);
      expect(esSearchSource.isFilterByMapBounds()).toBe(false);
    });
  });

  describe('getJoinsDisabledReason', () => {
    it('default', () => {
      const esSearchSource = new ESSearchSource({}, null);
      expect(esSearchSource.getJoinsDisabledReason()).toBe(null);
    });
    it('mvt', () => {
      const esSearchSource = new ESSearchSource({ scalingType: SCALING_TYPES.MVT }, null);
      expect(esSearchSource.getJoinsDisabledReason()).toBe(
        'Joins are not supported when scaling by mvt vector tiles'
      );
    });
  });

  describe('getFields', () => {
    it('default', () => {
      const esSearchSource = new ESSearchSource({}, null);
      const docField = esSearchSource.createField('prop1');
      expect(docField.canReadFromGeoJson()).toBe(true);
    });
    it('mvt', () => {
      const esSearchSource = new ESSearchSource({ scalingType: SCALING_TYPES.MVT }, null);
      const docField = esSearchSource.createField('prop1');
      expect(docField.canReadFromGeoJson()).toBe(false);
    });
  });
});
