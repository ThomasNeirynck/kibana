import { cryptoFactory } from '../../../server/lib/crypto';
import { oncePerServer } from '../../../server/lib/once_per_server';
import { createTaggedLogger } from '../../../server/lib/create_tagged_logger';
import { createGenerateCsv } from './lib/generate_csv';

function executeJobFn(server) {
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');
  const crypto = cryptoFactory(server);
  const uiSettings = server.uiSettings();
  const config = server.config();
  const logger = createTaggedLogger(server, ['reporting', 'csv', 'debug']);
  const generateCsv = createGenerateCsv(logger);

  return async function executeJob(job, cancellationToken) {
    const { searchRequest, fields, metaFields, conflictedTypesFields, headers: serializedEncryptedHeaders } = job;

    let decryptedHeaders;
    try {
      decryptedHeaders = await crypto.decrypt(serializedEncryptedHeaders);
    } catch (e) {
      throw new Error('Failed to decrypt report job data. Please re-generate this report.');
    }

    const fakeRequest = {
      headers: decryptedHeaders,
      path: ''
    };

    const callEndpoint = (endpoint, clientParams = {}, options = {}) => {
      return callWithRequest(fakeRequest, endpoint, clientParams, options);
    };

    const separator = await uiSettings.get(fakeRequest, 'csv:separator');
    const quoteValues = await uiSettings.get(fakeRequest, 'csv:quoteValues');
    const maxSizeBytes = config.get('xpack.reporting.csv.maxSizeBytes');
    const scroll = config.get('xpack.reporting.csv.scroll');

    const { content, maxSizeReached } = await generateCsv({
      searchRequest,
      fields,
      metaFields,
      conflictedTypesFields,
      callEndpoint,
      cancellationToken,
      settings: {
        separator,
        quoteValues,
        maxSizeBytes,
        scroll
      }
    });

    return {
      content_type: 'text/csv',
      content,
      max_size_reached: maxSizeReached
    };
  };
}

export const executeJobFactory = oncePerServer(executeJobFn);
