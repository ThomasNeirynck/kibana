/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { uiModules } from '../../modules';
import _ from 'lodash';
import MarkdownIt from 'markdown-it';
import { modifyUrl } from '../../url';

const markdownIt = new MarkdownIt({
  html: false,
  linkify: true
});

const TMS_IN_YML_ID = 'TMS in config/kibana.yml';
export const ORIGIN = {
  EMS: 'ems',
  KIBANA_YML: 'kibana_yml'
};


uiModules.get('kibana')
  .service('serviceSettings', function ($http, $sanitize, mapConfig, tilemapsConfig, kbnVersion) {

    const attributionFromConfig = $sanitize(markdownIt.render(tilemapsConfig.deprecated.config.options.attribution || ''));
    const tmsOptionsFromConfig = _.assign({}, tilemapsConfig.deprecated.config.options, { attribution: attributionFromConfig });

    const extendUrl = (url, props) => (
      modifyUrl(url, parsed => _.merge(parsed, props))
    );

    /**
     *  Unescape a url template that was escaped by encodeURI() so leaflet
     *  will be able to correctly locate the variables in the template
     *  @param  {String} url
     *  @return {String}
     */
    const unescapeTemplateVars = url => {
      const ENCODED_TEMPLATE_VARS_RE = /%7B(\w+?)%7D/g;
      return url.replace(ENCODED_TEMPLATE_VARS_RE, (total, varName) => `{${varName}}`);
    };


    class ServiceSettings {

      constructor() {
        this._queryParams = {
          my_app_version: kbnVersion
        };

        this._loadCatalogue = null;
        this._loadFileLayers = null;
        this._loadTMSServices = null;

        this._invalidateSettings();
      }

      _invalidateSettings() {

        this._loadCatalogue = _.once(async () => {

          if (!mapConfig.includeElasticMapsService) {
            return { services: [] };
          }

          try {
            const response = await this._getManifest(mapConfig.manifestServiceUrl, this._queryParams);
            return response.data;
          } catch (e) {
            if (!e) {
              e = new Error('Unknown error');
            }
            if (!(e instanceof Error)) {
              e = new Error(e.data || `status ${e.statusText || e.status}`);
            }
            throw new Error(`Could not retrieve manifest from the tile service: ${e.message}`);
          }
        });


        this._loadFileLayers = _.once(async () => {
          const catalogue = await this._loadCatalogue();

          const fileService = catalogue.services.find(service => service.type === 'file');
          if (!fileService) {
            return [];
          }

          const manifest = await this._getManifest(fileService.manifest, this._queryParams);
          const layers = manifest.data.layers.filter(layer => layer.format === 'geojson' || layer.format === 'topojson');
          layers.forEach((layer) => {
            // layer.url = ;
            layer.attribution = $sanitize(markdownIt.render(layer.attribution));
          });
          return layers;
        });

        this._loadTMSServices = _.once(async () => {

          const catalogue = await this._loadCatalogue();
          const tmsService = catalogue.services.find((service) => service.type === 'tms');
          if (!tmsService) {
            return [];
          }
          const tmsManifest = await this._getManifest(tmsService.manifest, this._queryParams);
          const preppedTMSServices = tmsManifest.data.services.map((tmsService) => {
            const preppedService = _.cloneDeep(tmsService);
            preppedService.attribution = $sanitize(markdownIt.render(preppedService.attribution));
            preppedService.subdomains = preppedService.subdomains || [];
            preppedService.origin = ORIGIN.EMS;
            return preppedService;
          });

          return preppedTMSServices;

        });

      }

      _extendUrlWithParams(url) {
        return unescapeTemplateVars(extendUrl(url, {
          query: this._queryParams
        }));
      }

      /**
       * this internal method is overridden by the tests to simulate custom manifest.
       */
      async _getManifest(manifestUrl) {
        return $http({
          url: extendUrl(manifestUrl, { query: this._queryParams }),
          method: 'GET'
        });
      }


      async getFileLayers() {
        const fileLayers = await this._loadFileLayers();

        const strippedFileLayers = fileLayers.map(fileLayer => {
          const strippedFileLayer = { ...fileLayer };
          //remove the properties that should not propagate and be used by clients.
          delete strippedFileLayer.url;
          return strippedFileLayer;
        });

        return strippedFileLayers;
      }


      /**
       * Returns all the services published by EMS (if configures)
       * It also includes the service configured in tilemap (override)
       */
      async getTMSServices() {

        const allServices = [];
        if (tilemapsConfig.deprecated.isOverridden) {//use tilemap.* settings from yml
          const tmsService = _.cloneDeep(tmsOptionsFromConfig);
          tmsService.id = TMS_IN_YML_ID;
          tmsService.origin = 'yml';
          allServices.push(tmsService);
        }

        const servicesFromManifest = await this._loadTMSServices();

        const strippedServiceFromManifest = servicesFromManifest.map((service) => {
          const strippedService = { ...service };
          //do not expose url. needs to be resolved dynamically
          delete strippedService.url;
          strippedService.origin = ORIGIN.EMS;
          return strippedService;
        });

        const st = allServices.concat(strippedServiceFromManifest);
        return st;

      }

      /**
       * Add optional query-parameters to all requests
       *
       * @param additionalQueryParams
       */
      addQueryParams(additionalQueryParams) {
        for (const key in additionalQueryParams) {
          if (additionalQueryParams.hasOwnProperty(key)) {
            if (additionalQueryParams[key] !== this._queryParams[key]) {
              //changes detected.
              this._queryParams = _.assign({}, this._queryParams, additionalQueryParams);
              this._invalidateSettings();
              break;
            }
          }
        }
      }

      async getEMSHotLink(fileLayer) {
        const id = `file/${fileLayer.name}`;
        return `${mapConfig.emsLandingPageUrl}#${id}`;
      }


      async _getUrlTemplateForEMSTMSLayer(tmsServiceConfig) {
        const tmsServices = await this._loadTMSServices();
        const serviceConfig = tmsServices.find(service => {
          return service.id === tmsServiceConfig.id;
        });
        return this._extendUrlWithParams(serviceConfig.url);
      }

      async getUrlTemplateForTMSLayer(tmsServiceConfig) {

        if (tmsServiceConfig.origin === ORIGIN.EMS) {
          return this._getUrlTemplateForEMSTMSLayer(tmsServiceConfig);
        } else if (tmsServiceConfig.origin === ORIGIN.KIBANA_YML) {
          return tilemapsConfig.deprecated.config.url;
        } else {
          //this is an older config. need to resolve this dynamically.
          if (tmsServiceConfig.id === TMS_IN_YML_ID) {
            return tilemapsConfig.deprecated.config.url;
          } else {
            //assume ems
            return this._getUrlTemplateForEMSTMSLayer(tmsServiceConfig);
          }
        }

      }

      async getGeoJsonForRegionLayer(fileLayerConfig) {

        let url;
        if (fileLayerConfig.origin === ORIGIN.EMS) {
          const fileLayers = await this._loadFileLayers();
          const layerConfig = fileLayers.find(fileLayer => {
            return fileLayer.name === fileLayerConfig.name;//the id is the filename
          });

          if (layerConfig) {
            url = this._extendUrlWithParams(layerConfig.url);
          } else {
            throw new Error(`File  ${fileLayerConfig.name} not recognized`);
          }
        } else {
          url = fileLayerConfig.url;//should dynamically resolve from regionmaps config too
        }

        const geojson = await $http({
          url: url,
          method: 'GET'
        });
        return geojson.data;
      }


    }

    return new ServiceSettings();
  });
