import Boom from 'boom';
import { ERR_CODES } from '../../../common/constants';

export function registerReindexRoutes(server) {
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('admin');

  server.route({
    path: '/api/migration/flat_settings/{indexName}/{filters?}',
    method: 'GET',
    handler: async (request, reply) => {
      const path = request.params.filters
        ? `${ encodeURIComponent(request.params.indexName) }/${ encodeURIComponent(request.params.filters) }?flat_settings`
        : `${ encodeURIComponent(request.params.indexName) }?flat_settings`;

      try {
        const response = await callWithRequest(request, 'transport.request', {
          path: path,
          method: 'GET',
        });
        return reply(response);

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };
        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/index/{indexName}',
    method: 'DELETE',
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'indices.delete', {
          index: request.params.indexName,
        });
        return reply(response);

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        if (requestError.body.error.type === 'index_not_found_exception') {
          err.output.payload = {
            ...err.output.payload,
            ...requestError.body.error,
            code: ERR_CODES.ERR_DELETE_INDEX_FAILED,
          };

        } else {
          err.output.payload = {
            ...err.output.payload,
            ...requestError.body.error,
          };
        }

        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/count/{indexName}',
    method: 'GET',
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'count', {
          index: request.params.indexName,
        });

        return reply(response);

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };
        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/settings/{indexName}',
    method: 'PUT',
    handler: async (request, reply) => {
      const path = `${ encodeURIComponent(request.params.indexName) }/_settings`;

      try {
        const response = await callWithRequest(request, 'transport.request', {
          path: path,
          method: 'PUT',
          body: request.payload,
        });
        return reply(response);

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };
        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/{indexName}',
    method: 'PUT',
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'transport.request', {
          path: encodeURIComponent(request.params.indexName),
          method: 'PUT',
          body: request.payload,
        });

        return reply(response);

      } catch (requestError) {
        let err;
        switch (requestError.body.error.type) {
          case 'index_already_exists_exception':
            err = Boom.badRequest(`Index ${ requestError.body.error.index } already exists.`);
            err.output.payload = {
              ...err.output.payload,
              code: ERR_CODES.ERR_INDEX_EXISTS,
            };
            break;

          case 'mapper_parsing_exception':
            err = Boom.badRequest(`Index mappings have errors.`);
            err.output.payload = {
              ...err.output.payload,
              code: ERR_CODES.ERR_MAPPER_PARSING_EXCEPTION,
            };
            break;

          default:
            err = Boom.wrap(requestError);
            err.output.payload = {
              ...err.output.payload,
              code: ERR_CODES.ERR_CREATE_INDEX_FAILED,
            };
        }

        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };

        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/reindex/{indexName}',
    method: 'POST',
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'transport.request', {
          path: '_reindex',
          method: 'POST',
          query: {
            wait_for_completion: false,
          },
          body: request.payload,
        });
        return reply(response);

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };
        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/task/{taskId}',
    method: 'GET',
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'transport.request', {
          path: `/_tasks/${ encodeURIComponent(request.params.taskId) }`,
          method: 'GET',
        });

        const { completed, error } = response;

        if (error) {
          const err = Boom.badRequest('Task failed.');
          err.output.payload = {
            ...err.output.payload,
            ...error,
            code: ERR_CODES.ERR_TASK_FAILED,
          };
          return reply(err);
        } else {
          return reply({ completed });
        }

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };
        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/task/{taskId}',
    method: 'DELETE',
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'transport.request', {
          path: `.tasks/task/${ encodeURIComponent(request.params.taskId) }`,
          method: 'DELETE',
        });
        return reply(response);

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        if (requestError.body.result === 'not_found') {
          err.output.payload = {
            ...err.output.payload,
            ...requestError.body,
            code: ERR_CODES.ERR_DELETE_TASK_FAILED,
          };

        } else {
          err.output.payload = {
            ...err.output.payload,
            ...requestError.body,
          };
        }
        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/task/{taskId}',
    method: 'POST',
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'transport.request', {
          path: `/_tasks/${ encodeURIComponent(request.params.taskId) }/_cancel`,
          method: 'POST',
        });
        return reply(response);

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };
        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/refresh/{indexName}',
    method: 'POST',
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'transport.request', {
          path: `${ encodeURIComponent(request.params.indexName) }/_refresh`,
          method: 'POST',
        });
        return reply(response);

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };
        return reply(err);
      }
    },
  });

  server.route({
    path: '/api/migration/aliases',
    method: 'POST',
    handler: async (request, reply) => {
      try {
        const response = await callWithRequest(request, 'transport.request', {
          path: '_aliases',
          method: 'POST',
          body: request.payload,
        });

        return reply(response);

      } catch (requestError) {
        const err = Boom.wrap(requestError);
        err.output.payload = {
          ...err.output.payload,
          ...requestError.body.error,
        };
        return reply(err);
      }
    },
  });
}
