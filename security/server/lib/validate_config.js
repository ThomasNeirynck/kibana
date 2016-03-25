export default (config, log) => {
  if (config.get('xpack.security.encryptionKey') == null) {
    throw new Error('xpack.security.encryptionKey is required in kibana.yml.');
  }

  const isSslConfigured = config.get('server.ssl.key') != null && config.get('server.ssl.cert') != null;
  if (config.get('xpack.security.skipSslCheck')) {
    log('Skipping Kibana server SSL check');
    if (!config.get('xpack.security.useUnsafeSession')) log('Note that SSL is required for this plugin to function');
  } else if (!isSslConfigured) {
    throw new Error('HTTPS is required. Please set server.ssl.key and server.ssl.cert in kibana.yml.');
  }

  if (config.get('xpack.security.useUnsafeSession')) log('Operating with insecure sessions, this is not recommended');
};
