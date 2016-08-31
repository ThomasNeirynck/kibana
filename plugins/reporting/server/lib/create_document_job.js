const moment = require('moment');
const { get } = require('lodash');
const constants = require('./constants');
const getUserFactory = require('./get_user');
const getObjectQueueFactory = require('./get_object_queue');
import cryptoFactory from './crypto';
const oncePerServer = require('./once_per_server');

function createDocumentJobFactory(server) {
  const jobQueue = server.plugins.reporting.queue;
  const filterHeaders = server.plugins.elasticsearch.filterHeaders;
  const queueConfig = server.config().get('xpack.reporting.queue');
  const whitelistHeaders = server.config().get('elasticsearch.requestHeadersWhitelist');

  const getObjectQueue = getObjectQueueFactory(server);
  const getUser = getUserFactory(server);
  const crypto = cryptoFactory(server);

  const { JOBTYPES_PRINTABLE_PDF } = constants;
  const jobTypes = {};

  jobTypes[JOBTYPES_PRINTABLE_PDF] = async function (objectType, request) {
    const date = moment().toISOString();
    const objId = request.params.savedId;
    const query = request.query;

    const headers = get(request, 'headers');
    const serializedEncryptedHeaders = await crypto.encrypt(headers);

    return getUser(request)
    .then((user) => {
      // get resulting kibana saved object documents
      return getObjectQueue(objectType, objId)
      .then(function (objectQueue) {
        server.log(['reporting', 'debug'], `${objectQueue.length} saved object(s) to process`);

        const savedObjects = objectQueue.objects.map((savedObj) => savedObj.toJSON(query));

        const payload = {
          id: objectQueue.id,
          title: objectQueue.title,
          description: objectQueue.description,
          type: objectQueue.type,
          objects: savedObjects,
          date,
          query,
          headers: serializedEncryptedHeaders,
        };

        const options = {
          timeout: queueConfig.timeout * objectQueue.length,
          created_by: get(user, 'username', false),
          headers: filterHeaders(headers, whitelistHeaders),
        };

        return jobQueue.addJob(JOBTYPES_PRINTABLE_PDF, payload, options);
      });
    });
  };

  return jobTypes;
}

module.exports = oncePerServer(createDocumentJobFactory);
