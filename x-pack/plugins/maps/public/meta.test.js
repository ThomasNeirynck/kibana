/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EMSClient } from '@elastic/ems-client';
import { getEMSClient, getGlyphUrl } from './meta';

jest.mock('@elastic/ems-client');

describe('default use without proxy', () => {
  beforeEach(() => {
    require('./kibana_services').getProxyElasticMapsServiceInMaps = () => false;
    require('./kibana_services').getIsEmsEnabled = () => true;
    require('./licensed_features').getLicenseId = () => {
      return 'foobarlicenseid';
    };
  });

  test('should construct EMSClient with absolute file and tile API urls', async () => {
    getEMSClient();
    const mockEmsClientCall = EMSClient.mock.calls[0];
    expect(mockEmsClientCall[0].fileApiUrl.startsWith('https://file-api')).toBe(true);
    expect(mockEmsClientCall[0].tileApiUrl.startsWith('https://tile-api')).toBe(true);
  });
});

describe('getGlyphUrl', () => {
  describe('EMS enabled', () => {
    const EMS_FONTS_URL_MOCK = 'ems/fonts';
    beforeAll(() => {
      require('./kibana_services').getIsEmsEnabled = () => true;
      require('./kibana_services').getHttp = () => ({
        basePath: {
          prepend: (url) => url, // No need to actually prepend a dev basepath for test
        },
      });
    });

    describe('EMS proxy enabled', () => {
      beforeAll(() => {
        require('./kibana_services').getProxyElasticMapsServiceInMaps = () => true;
      });

      test('should return proxied EMS fonts URL', async () => {
        expect(getGlyphUrl()).toBe('http://localhost/api/maps/ems/tiles/fonts/{fontstack}/{range}');
      });
    });

    describe('EMS proxy disabled', () => {
      beforeAll(() => {
        require('./kibana_services').getProxyElasticMapsServiceInMaps = () => false;
      });

      test('should return EMS fonts URL', async () => {
        expect(getGlyphUrl()).toBe(EMS_FONTS_URL_MOCK);
      });
    });
  });

  describe('EMS disabled', () => {
    beforeAll(() => {
      const mockHttp = {
        basePath: {
          prepend: (path) => `abc${path}`,
        },
      };
      require('./kibana_services').getHttp = () => mockHttp;
      require('./kibana_services').getIsEmsEnabled = () => false;
    });

    test('should return kibana fonts URL', async () => {
      expect(getGlyphUrl()).toBe('abc/api/maps/fonts/{fontstack}/{range}');
    });
  });
});
