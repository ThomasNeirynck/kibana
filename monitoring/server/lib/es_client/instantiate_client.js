import { once, bindKey } from 'lodash';
import url from 'url';
import { readFileSync } from 'fs';
import Promise from 'bluebird';
import elasticsearch from 'elasticsearch';

/* Provide a dedicated Elasticsearch client for Monitoring
 * The connection options can be customized for the Monitoring application
 * This allows the app to connect to a decidated monitoring cluster even if
 * Kibana itself is connected to a production cluster.
 */

const readFile = (file) => {
  readFileSync(file, 'utf8');
};

function exposeClient(server) {
  const config = server.config();
  const callWithRequestFactory = server.plugins.elasticsearch.callWithRequestFactory;
  const ElasticsearchClientLogging = server.plugins.elasticsearch.ElasticsearchClientLogging;

  /* Overrides the trace method so we can have query logging
   * logs can be copy+pasted into Sense */
  class MonitoringClientLogging extends ElasticsearchClientLogging {
    trace(method, options, query, _response, statusCode) {
      /* Check if query logging is enabled and if the query has the "meta"
       * field which is added for traceability.
       * It requires Kibana to be configured with verbose logging turned on. */
      if (config.get('monitoring.elasticsearch.logQueries')) {
        if (options.path.match(/meta=/)) {
          const loggingTag = config.get('monitoring.loggingTag');
          const methodAndPath = `${method} ${options.path}`;
          const queryDsl = query ? query.trim() : '';
          server.log([loggingTag, 'es-query'], [
            statusCode,
            methodAndPath,
            queryDsl
          ].join('\n'));
        }
      }
    }
  }

  const options = {
    url: config.get('monitoring.elasticsearch.url'),
    username: config.get('monitoring.elasticsearch.username'),
    password: config.get('monitoring.elasticsearch.password'),
    verifySsl: config.get('monitoring.elasticsearch.ssl.verify'),
    clientCrt: config.get('monitoring.elasticsearch.ssl.cert'),
    clientKey: config.get('monitoring.elasticsearch.ssl.key'),
    ca: config.get('monitoring.elasticsearch.ssl.ca'),
    apiVersion: config.get('monitoring.elasticsearch.apiVersion'),
    pingTimeout: config.get('monitoring.elasticsearch.pingTimeout'),
    requestTimeout: config.get('monitoring.elasticsearch.requestTimeout'),
    keepAlive: true,
    auth: true
  };

  const uri = url.parse(options.url);
  if (options.auth && options.username && options.password) {
    uri.auth = `${options.username}:${options.password}`;
  }

  const ssl = { rejectUnauthorized: options.verifySsl };
  if (options.clientCrt && options.clientKey) {
    ssl.cert = readFile(options.clientCrt);
    ssl.key = readFile(options.clientKey);
  }
  if (options.ca) {
    ssl.ca = options.ca.map(readFile);
  }

  const client = new elasticsearch.Client({
    host: url.format(uri),
    ssl: ssl,
    plugins: options.plugins,
    apiVersion: options.apiVersion,
    keepAlive: options.keepAlive,
    pingTimeout: options.pingTimeout,
    requestTimeout: options.requestTimeout,
    defer: function () {
      return Promise.defer();
    },
    log: MonitoringClientLogging
  });

  const callWithRequest = callWithRequestFactory(client);

  server.on('close', bindKey(client, 'close'));
  server.expose('client', client);
  server.expose('callWithRequest', callWithRequest);
}

const instantiateClient = once(exposeClient);

export default instantiateClient;
