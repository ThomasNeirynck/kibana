/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */


import { EMS_DATA_FILE_PATH, EMS_DATA_TMS_PATH, GIS_API_PATH } from '../common/constants';
import fetch from 'node-fetch';
import _ from 'lodash';
import { i18n } from '@kbn/i18n';
import { getEMSResources } from '../common/ems_util';

const ROOT = `/${GIS_API_PATH}`;

export function initRoutes(server, licenseUid) {

  const serverConfig = server.config();
  const mapConfig = serverConfig.get('map');

  const emsClient = new server.plugins.tile_map.ems_client.EMSClient({
    language: i18n.getLocale(),
    kbnVersion: serverConfig.get('pkg.version'),
    manifestServiceUrl: mapConfig.manifestServiceUrl,
    landingPageUrl: mapConfig.emsLandingPageUrl
  });

  server.route({
    method: 'GET',
    path: `${ROOT}/${EMS_DATA_FILE_PATH}`,
    handler: async (request) => {

      if (!request.query.id) {
        server.log('warning', 'Must supply id parameters to retrieve EMS file');
        return null;
      }

      const ems = await getEMSResources(emsClient, mapConfig.includeElasticMapsService, licenseUid, true);
      const layer = ems.fileLayers.find(layer => layer.id === request.query.id);
      if (!layer) {
        return null;
      }

      const file = await fetch(layer.url);
      return await file.json();

    }
  });


  server.route({
    method: 'GET',
    path: `${ROOT}/${EMS_DATA_TMS_PATH}`,
    handler: async (request, h) => {

      if (!request.query.id ||
        typeof parseInt(request.query.x, 10) !== 'number' ||
        typeof parseInt(request.query.y, 10) !== 'number' ||
        typeof parseInt(request.query.z, 10) !== 'number'
      ) {
        server.log('warning', 'Must supply id/x/y/z parameters to retrieve EMS tile');
        return null;
      }

      const ems = await getEMSResources(emsClient, mapConfig.includeElasticMapsService, licenseUid, true);
      const tmsService = ems.tmsServices.find(layer => layer.id === request.query.id);
      if (!tmsService) {
        return null;
      }

      const url = tmsService.url
        .replace('{x}', request.query.x)
        .replace('{y}', request.query.y)
        .replace('{z}', request.query.z);


      const tile = await fetch(url);
      const arrayBuffer = await tile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let  response =  h.response(buffer);
      response = response.bytes(buffer.length);
      response = response.header('Content-Disposition', 'inline');
      response = response.header('Content-type', 'image/png');
      response = response.encoding('binary');


      return response;
    }
  });

  server.route({
    method: 'GET',
    path: `${ROOT}/meta`,
    handler: async () => {

      let ems;
      const emptyResponse = {
        fileLayers: [],
        tmsServices: []
      };

      if (mapConfig.useCORSForElasticMapsService) {
        ems = emptyResponse;
      } else {
        try {
          ems = await getEMSResources(emsClient, mapConfig.includeElasticMapsService, licenseUid, mapConfig.useCORSForElasticMapsService);
        } catch (e) {
          server.log('warning', `Cannot connect to EMS, error: ${e}`);
          ems = emptyResponse;
        }
      }

      return ({
        data_sources: {
          ems: {
            file: ems.fileLayers,
            tms: ems.tmsServices
          },
          kibana: {
            regionmap: _.get(mapConfig, 'regionmap.layers', []),
            tilemap: _.get(mapConfig, 'tilemap', [])
          }
        }
      });
    }
  });

  server.route({
    method: 'GET',
    path: `${ROOT}/indexCount`,
    handler: async (request, h) => {
      const { server, query } = request;

      if (!query.index) {
        return h.response().code(400);
      }

      const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');

      try {
        const { count } = await callWithRequest(request, 'count', { index: query.index });
        return { count };
      } catch(error) {
        return h.response().code(400);
      }
    }
  });
}
