/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { ServerInjectOptions } from 'hapi';
import { omit } from 'lodash/fp';
import { deleteRulesRoute } from './delete_rules_route';
import * as utils from './utils';
import * as deleteRules from '../../rules/delete_rules';

import {
  getFindResult,
  getResult,
  getDeleteRequest,
  getFindResultWithSingleHit,
  getDeleteRequestById,
  getFindResultStatus,
} from '../__mocks__/request_responses';
import { createMockServer, clientsServiceMock } from '../__mocks__';
import { DETECTION_ENGINE_RULES_URL } from '../../../../../common/constants';

describe('delete_rules', () => {
  let server = createMockServer();
  let getClients = clientsServiceMock.createGetScoped();
  let clients = clientsServiceMock.createClients();

  beforeEach(() => {
    // jest carries state between mocked implementations when using
    // spyOn. So now we're doing all three of these.
    // https://github.com/facebook/jest/issues/7136#issuecomment-565976599
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.clearAllMocks();
    server = createMockServer();
    getClients = clientsServiceMock.createGetScoped();
    clients = clientsServiceMock.createClients();

    getClients.mockResolvedValue(clients);

    deleteRulesRoute(server.route, getClients);
  });

  describe('status codes with actionClient and alertClient', () => {
    test('returns 200 when deleting a single rule with a valid actionClient and alertClient by alertId', async () => {
      clients.alertsClient.find.mockResolvedValue(getFindResultWithSingleHit());
      clients.alertsClient.get.mockResolvedValue(getResult());
      clients.alertsClient.delete.mockResolvedValue({});
      clients.savedObjectsClient.find.mockResolvedValue(getFindResultStatus());
      clients.savedObjectsClient.delete.mockResolvedValue({});
      const { statusCode } = await server.inject(getDeleteRequest());
      expect(statusCode).toBe(200);
    });

    test('returns 200 when deleting a single rule with a valid actionClient and alertClient by id', async () => {
      clients.alertsClient.find.mockResolvedValue(getFindResultWithSingleHit());
      clients.alertsClient.get.mockResolvedValue(getResult());
      clients.alertsClient.delete.mockResolvedValue({});
      clients.savedObjectsClient.find.mockResolvedValue(getFindResultStatus());
      clients.savedObjectsClient.delete.mockResolvedValue({});
      const { statusCode } = await server.inject(getDeleteRequestById());
      expect(statusCode).toBe(200);
    });

    test('returns 404 when deleting a single rule that does not exist with a valid actionClient and alertClient', async () => {
      clients.alertsClient.find.mockResolvedValue(getFindResult());
      clients.alertsClient.get.mockResolvedValue(getResult());
      clients.alertsClient.delete.mockResolvedValue({});
      clients.savedObjectsClient.find.mockResolvedValue(getFindResultStatus());
      clients.savedObjectsClient.delete.mockResolvedValue({});
      const { statusCode } = await server.inject(getDeleteRequest());
      expect(statusCode).toBe(404);
    });

    test('returns 404 if alertClient is not available on the route', async () => {
      getClients.mockResolvedValue(omit('alertsClient', clients));
      const { route, inject } = createMockServer();
      deleteRulesRoute(route, getClients);
      const { statusCode } = await inject(getDeleteRequest());
      expect(statusCode).toBe(404);
    });

    test('returns 500 when transform fails', async () => {
      clients.alertsClient.find.mockResolvedValue(getFindResultWithSingleHit());
      clients.alertsClient.get.mockResolvedValue(getResult());
      clients.alertsClient.delete.mockResolvedValue({});
      clients.savedObjectsClient.find.mockResolvedValue(getFindResultStatus());
      clients.savedObjectsClient.delete.mockResolvedValue({});
      jest.spyOn(utils, 'transform').mockReturnValue(null);
      const { payload, statusCode } = await server.inject(getDeleteRequest());
      expect(JSON.parse(payload).message).toBe('Internal error transforming rules');
      expect(statusCode).toBe(500);
    });

    test('catches error if deleteRules throws error', async () => {
      clients.alertsClient.find.mockResolvedValue(getFindResultWithSingleHit());
      clients.alertsClient.get.mockResolvedValue(getResult());
      clients.alertsClient.delete.mockResolvedValue({});
      clients.savedObjectsClient.find.mockResolvedValue(getFindResultStatus());
      clients.savedObjectsClient.delete.mockResolvedValue({});
      jest.spyOn(deleteRules, 'deleteRules').mockImplementation(async () => {
        throw new Error('Test error');
      });
      const { payload, statusCode } = await server.inject(getDeleteRequestById());
      expect(JSON.parse(payload).message).toBe('Test error');
      expect(statusCode).toBe(500);
    });
  });

  describe('validation', () => {
    test('returns 400 if given a non-existent id', async () => {
      clients.alertsClient.find.mockResolvedValue(getFindResult());
      clients.alertsClient.get.mockResolvedValue(getResult());
      clients.alertsClient.delete.mockResolvedValue({});
      const request: ServerInjectOptions = {
        method: 'DELETE',
        url: DETECTION_ENGINE_RULES_URL,
      };
      const { statusCode } = await server.inject(request);
      expect(statusCode).toBe(400);
    });
  });
});
