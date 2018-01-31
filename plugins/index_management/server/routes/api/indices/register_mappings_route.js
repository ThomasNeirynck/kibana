import { callWithRequestFactory } from '../../../lib/call_with_request_factory';
import { isEsErrorFactory } from '../../../lib/is_es_error_factory';
import { wrapEsError, wrapUnknownError } from '../../../lib/error_wrappers';
import { licensePreRoutingFactory } from'../../../lib/license_pre_routing_factory';

function getIndexNamesFromPayload(payload) {
  return payload.indexNames || [];
}

function formatHits(hits) {
  return hits.map(hit => {
    return {
      health: hit.health,
      status: hit.status,
      name: hit.index,
      uuid: hit.uuid,
      primary: hit.pri,
      replica: hit.rep,
      documents: hit["docs.count"],
      documents_deleted: hit["docs.deleted"],
      size: hit["store.size"],
      primary_size: hit["pri.store.size"],
    };
  });
}

async function fetchMappings(callWithRequest, indexNames) {
  const params = {
    format: 'json',
    index: indexNames
  };

  return await callWithRequest('mappings', params);
}

export function registerMappingsRoute(server) {
  const isEsError = isEsErrorFactory(server);
  const licensePreRouting = licensePreRoutingFactory(server);

  server.route({
    path: '/api/index_management/indices/mappings',
    method: 'POST',
    handler: async (request, reply) => {
      const callWithRequest = callWithRequestFactory(server, request);
      const indexNames = getIndexNamesFromPayload(request.payload);

      try {
        const hits = await fetchMappings(callWithRequest, indexNames);
        const response = formatHits(hits);
        reply(response);
      } catch (err) {
        if (isEsError(err)) {
          return reply(wrapEsError(err));
        }

        reply(wrapUnknownError(err));
      }
    },
    config: {
      pre: [ licensePreRouting ]
    }
  });
}
