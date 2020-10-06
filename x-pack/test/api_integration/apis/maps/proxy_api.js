/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from '@kbn/expect';

export default function ({ getService }) {
  const supertest = getService('supertest');

  describe('EMS proxy', () => {
    it('should correctly rewrite url and format', async () => {
      const resp = await supertest
        .get(`/api/maps/ems/files/v7.10/manifest`)
        .set('kbn-xsrf', 'kibana')
        .expect(200);

      expect(resp.body.layers.length).to.be(66);

      //Check world-layer
      const worldLayer = resp.body.layers.find((layer) => layer.layer_id === 'world_countries');
      expect(worldLayer.formats.length).to.be(1);
      expect(worldLayer.formats[0].type).to.be('geojson');
      expect(worldLayer.formats[0].url).to.be('file?id=world_countries');
    });
  });
}
