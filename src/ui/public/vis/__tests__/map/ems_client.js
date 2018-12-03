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

import expect from 'expect.js';
import EMS_CATALOGUE from './ems_mocks/sample_manifest_6.6.json';
import EMS_FILES from './ems_mocks/sample_files_6.6.json';
import EMS_TILES from './ems_mocks/sample_tiles_6.6.json';


import { EMSClientV66 } from '../../../../../core_plugins/ems_util/common/ems_client';

describe('ems_client', () => {


  it('should get the tile service', async () => {

    const emsClient = getEMSClient();
    const tiles = await emsClient.getTMSServices();

    expect(tiles.length).to.be(1);


    const tileService = tiles[0];
    expect(tileService.getUrlTemplate()).to.be('https://tiles-stage.elastic.co/v2/default/{z}/{x}/{y}.png?elastic_tile_service_tos=agree&my_app_name=kibana&my_app_version=6.x.x');

    expect (tileService.getHTMLAttribution()).to.be('<p>© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://www.elastic.co/elastic-maps-service">Elastic Maps Service</a></p>\n');
    expect (tileService.getMinZoom()).to.be(0);
    expect (tileService.getMaxZoom()).to.be(10);



  });

  it('.addQueryParams', async () => {

    const emsClient = getEMSClient();
    emsClient.addQueryParams({
      'foo': 'bar'
    });
    const tiles = await emsClient.getTMSServices();
    const url = tiles[0].getUrlTemplate();
    expect(url).to.be('https://tiles-stage.elastic.co/v2/default/{z}/{x}/{y}.png?elastic_tile_service_tos=agree&my_app_name=kibana&my_app_version=6.x.x&foo=bar');


  });

});


function getEMSClient() {

  const emsClient = new EMSClientV66({
    kbnVersion: '6.x.x',
    manifestServiceUrl: 'https://foobar',
    htmlSanitizer: x => x
  });

  emsClient._getManifest = async (url) => {
    //simulate network calls
    if (url.startsWith('https://foobar')) {
      return EMS_CATALOGUE;
    } else if (url.startsWith('https://tiles.foobar')) {
      return EMS_TILES;
    } else if (url.startsWith('https://files.foobar')) {
      return EMS_FILES;
    }
  };
  return emsClient;
}
