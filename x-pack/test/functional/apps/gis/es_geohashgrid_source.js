/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from 'expect.js';

export default function ({ getPageObjects, getService }) {

  const PageObjects = getPageObjects(['gis']);
  const queryBar = getService('queryBar');
  const inspector = getService('inspector');
  const DOC_COUNT_PROP_NAME = 'doc_count';

  describe('layer geohashgrid aggregation source', () => {

    const EXPECTED_NUMBER_FEATURES = 6;
    const DATA_CENTER_LON = -98;
    const DATA_CENTER_LAT = 38;

    async function getRequestTimestamp() {
      await PageObjects.gis.openInspectorRequestsView();
      const requestStats = await inspector.getTableData();
      const requestTimestamp =  PageObjects.gis.getInspectorStatRowHit(requestStats, 'Request timestamp');
      await inspector.close();
      return requestTimestamp;
    }

    function makeRequestTestsForGeoPrecision(LAYER_ID) {

      describe('geoprecision - requests', async () => {
        let beforeTimestamp;
        beforeEach(async () => {
          await PageObjects.gis.setView(DATA_CENTER_LAT, DATA_CENTER_LON, 1);
          beforeTimestamp = await getRequestTimestamp();
        });

        it('should not rerequest when zoom changes does not cause geohash precision to change', async () => {
          await PageObjects.gis.setView(DATA_CENTER_LAT, DATA_CENTER_LON, 2);
          const afterTimestamp = await getRequestTimestamp();
          expect(afterTimestamp).to.equal(beforeTimestamp);
        });

        it('should rerequest when zoom changes causes the geohash precision to change', async () => {
          await PageObjects.gis.setView(DATA_CENTER_LAT, DATA_CENTER_LON, 4);
          const afterTimestamp = await getRequestTimestamp();
          expect(afterTimestamp).not.to.equal(beforeTimestamp);
        });
      });

      describe('geoprecision - data', async ()=> {

        beforeEach(async () => {
          await PageObjects.gis.setView(DATA_CENTER_LAT, DATA_CENTER_LON, 1);
        });

        it ('should not return any data when the extent does not cover the data bounds', async () => {
          await PageObjects.gis.setView(64, 179, 5);
          const mapboxStyle = await PageObjects.gis.getMapboxStyle();
          expect(mapboxStyle.sources[LAYER_ID].data.features.length).to.equal(0);
        });

        it ('should request the data when the map covers the databounds', async () => {
          const mapboxStyle = await PageObjects.gis.getMapboxStyle();
          expect(mapboxStyle.sources[LAYER_ID].data.features.length).to.equal(EXPECTED_NUMBER_FEATURES);
        });

        it ('should have the same data when a zoom change does not cause a precision change', async () => {
          await PageObjects.gis.setView(DATA_CENTER_LAT, DATA_CENTER_LON, 2);
          const mapboxStyle = await PageObjects.gis.getMapboxStyle();
          expect(mapboxStyle.sources[LAYER_ID].data.features.length).to.equal(EXPECTED_NUMBER_FEATURES);
        });

        it ('should request only partial data when the map conly overs part of the databounds', async () => {
          await PageObjects.gis.setView(DATA_CENTER_LAT, DATA_CENTER_LON, 6);
          const mapboxStyle = await PageObjects.gis.getMapboxStyle();
          expect(mapboxStyle.sources[LAYER_ID].data.features.length).to.equal(2);
        });

      });


    }

    describe('heatmap', () => {
      before(async () => {
        await PageObjects.gis.loadSavedMap('geohashgrid heatmap example');
      });

      const LAYER_ID = '3xlvm';
      const HEATMAP_PROP_NAME = '__kbn_heatmap_weight__';

      it('should re-fetch geohashgrid aggregation with refresh timer', async () => {
        const beforeRefreshTimerTimestamp = await getRequestTimestamp();
        expect(beforeRefreshTimerTimestamp.length).to.be(24);
        await PageObjects.gis.triggerSingleRefresh(1000);
        const afterRefreshTimerTimestamp = await getRequestTimestamp();
        expect(beforeRefreshTimerTimestamp).not.to.equal(afterRefreshTimerTimestamp);
      });

      it('should decorate feature properties with scaled doc_count property', async () => {
        const mapboxStyle = await PageObjects.gis.getMapboxStyle();
        expect(mapboxStyle.sources[LAYER_ID].data.features.length).to.equal(EXPECTED_NUMBER_FEATURES);

        mapboxStyle.sources[LAYER_ID].data.features.forEach(({ properties }) => {
          expect(properties.hasOwnProperty(HEATMAP_PROP_NAME)).to.be(true);
          expect(properties.hasOwnProperty(DOC_COUNT_PROP_NAME)).to.be(true);
        });
      });

      makeRequestTestsForGeoPrecision(LAYER_ID);

      describe('query bar', () => {
        before(async () => {
          await queryBar.setQuery('machine.os.raw : "win 8"');
          await queryBar.submitQuery();
          await PageObjects.gis.setView(0, 0, 0);
        });

        after(async () => {
          await queryBar.setQuery('');
          await queryBar.submitQuery();
        });

        it('should apply query to geohashgrid aggregation request', async () => {
          await PageObjects.gis.openInspectorRequestsView();
          const requestStats = await inspector.getTableData();
          const hits = PageObjects.gis.getInspectorStatRowHit(requestStats, 'Hits (total)');
          await inspector.close();
          expect(hits).to.equal('1');
        });
      });

      describe('inspector', () => {
        afterEach(async () => {
          await inspector.close();
        });

        it('should contain geohashgrid aggregation elasticsearch request', async () => {
          await PageObjects.gis.openInspectorRequestsView();
          const requestStats = await inspector.getTableData();
          const totalHits =  PageObjects.gis.getInspectorStatRowHit(requestStats, 'Hits (total)');
          expect(totalHits).to.equal('6');
          const hits =  PageObjects.gis.getInspectorStatRowHit(requestStats, 'Hits');
          expect(hits).to.equal('0'); // aggregation requests do not return any documents
          const indexPatternName =  PageObjects.gis.getInspectorStatRowHit(requestStats, 'Index pattern');
          expect(indexPatternName).to.equal('logstash-*');
        });

        it('should not contain any elasticsearch request after layer is deleted', async () => {
          await PageObjects.gis.removeLayer('logstash-*');
          const noRequests = await PageObjects.gis.doesInspectorHaveRequests();
          expect(noRequests).to.equal(true);
        });
      });
    });

    describe('vector(grid)', () => {
      before(async () => {
        await PageObjects.gis.loadSavedMap('geohashgrid vector grid example');
      });

      const LAYER_ID = 'g1xkv';

      const MAX_OF_BYTES_PROP_NAME = 'max_of_bytes';

      it('should re-fetch geohashgrid aggregation with refresh timer', async () => {
        const beforeRefreshTimerTimestamp = await getRequestTimestamp();
        expect(beforeRefreshTimerTimestamp.length).to.be(24);
        await PageObjects.gis.triggerSingleRefresh(1000);
        const afterRefreshTimerTimestamp = await getRequestTimestamp();
        expect(beforeRefreshTimerTimestamp).not.to.equal(afterRefreshTimerTimestamp);
      });

      it('should decorate feature properties with metrics properterties', async () => {
        const mapboxStyle = await PageObjects.gis.getMapboxStyle();
        expect(mapboxStyle.sources[LAYER_ID].data.features.length).to.equal(EXPECTED_NUMBER_FEATURES);

        mapboxStyle.sources[LAYER_ID].data.features.forEach(({ properties }) => {
          expect(properties.hasOwnProperty(MAX_OF_BYTES_PROP_NAME)).to.be(true);
          expect(properties.hasOwnProperty(DOC_COUNT_PROP_NAME)).to.be(true);
        });
      });

      makeRequestTestsForGeoPrecision(LAYER_ID);


      describe('query bar', () => {
        before(async () => {
          await PageObjects.gis.setView(0, 0, 0);
          await queryBar.setQuery('machine.os.raw : "win 8"');
          await queryBar.submitQuery();
        });

        after(async () => {
          await queryBar.setQuery('');
          await queryBar.submitQuery();
        });

        it('should apply query to geohashgrid aggregation request', async () => {
          await PageObjects.gis.openInspectorRequestsView();
          const requestStats = await inspector.getTableData();
          const hits = PageObjects.gis.getInspectorStatRowHit(requestStats, 'Hits (total)');
          await inspector.close();
          expect(hits).to.equal('1');
        });
      });

      describe('inspector', () => {
        afterEach(async () => {
          await inspector.close();
        });

        it('should contain geohashgrid aggregation elasticsearch request', async () => {
          await PageObjects.gis.openInspectorRequestsView();
          const requestStats = await inspector.getTableData();
          const totalHits =  PageObjects.gis.getInspectorStatRowHit(requestStats, 'Hits (total)');
          expect(totalHits).to.equal('6');
          const hits =  PageObjects.gis.getInspectorStatRowHit(requestStats, 'Hits');
          expect(hits).to.equal('0'); // aggregation requests do not return any documents
          const indexPatternName =  PageObjects.gis.getInspectorStatRowHit(requestStats, 'Index pattern');
          expect(indexPatternName).to.equal('logstash-*');
        });

        it('should not contain any elasticsearch request after layer is deleted', async () => {
          await PageObjects.gis.removeLayer('logstash-*');
          const noRequests = await PageObjects.gis.doesInspectorHaveRequests();
          expect(noRequests).to.equal(true);
        });
      });

    });

  });
}
