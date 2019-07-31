/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */


import {
  GIS_API_PATH,
  EMS_CATALOGUE_PATH,
  EMS_TILES_CATALOGUE_PATH,
  EMS_FILES_CATALOGUE_PATH,
  EMS_FILES_DATA_PATH,
  EMS_TILES_RASTER_PATH
} from '../common/constants';
import chrome from 'ui/chrome';
import { i18n } from '@kbn/i18n';
import { EMSClient } from 'ui/vis/map/ems_client';
import { xpackInfo } from './kibana_services';

const GIS_API_RELATIVE = `../${GIS_API_PATH}`;

export function getKibanaRegionList() {
  return chrome.getInjected('regionmapLayers');
}

export function getKibanaTileMap() {
  return chrome.getInjected('tilemap');
}

let emsClient = null;
let latestLicenseId = null;
export function getEMSClient() {
  if (!emsClient) {
    const isEmsEnabled = chrome.getInjected('isEmsEnabled', true);
    if (isEmsEnabled) {

      const proxyElasticMapsServiceInMaps = chrome.getInjected('proxyElasticMapsServiceInMaps', false);
      const proxyOptions = proxyElasticMapsServiceInMaps ? {
        catalogueUrl: `${GIS_API_RELATIVE}/${EMS_CATALOGUE_PATH}`,
        tilesCatalogue: `${GIS_API_RELATIVE}/${EMS_TILES_CATALOGUE_PATH}`,
        filesCatalogue: `${GIS_API_RELATIVE}/${EMS_FILES_CATALOGUE_PATH}`,
        fileLayerDefaultJson: `${GIS_API_RELATIVE}/${EMS_FILES_DATA_PATH}`,
        tmsServiceDefaultRaster: `${GIS_API_RELATIVE}/${EMS_TILES_RASTER_PATH}`
      } : null;

      emsClient = new EMSClient({
        language: i18n.getLocale(),
        kbnVersion: chrome.getInjected('kbnPkgVersion'),
        manifestServiceUrl: chrome.getInjected('emsManifestServiceUrl'),
        landingPageUrl: chrome.getInjected('emsLandingPageUrl'),
        proxyElasticMapsServiceInMaps: proxyElasticMapsServiceInMaps,
        proxyElasticMapsServiceInMapsOptions: proxyOptions
      });
    } else {
      //EMS is turned off. Mock API.
      emsClient = {
        async getFileLayers() {
          return [];
        },
        async getTMSServices() {
          return [];
        },
        addQueryParams() {}
      };
    }
  }
  const xpackMapsFeature = xpackInfo.get('features.maps');
  const licenseId = xpackMapsFeature && xpackMapsFeature.maps && xpackMapsFeature.uid ? xpackMapsFeature.uid :  '';
  if (latestLicenseId !== licenseId) {
    latestLicenseId = licenseId;
    emsClient.addQueryParams({ license: licenseId });
  }
  return emsClient;

}
