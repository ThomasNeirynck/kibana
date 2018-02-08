import { resolveKibanaPath } from '@kbn/plugin-helpers';
import { SupertestWithoutAuthProvider } from './services';

export default async function ({ readConfigFile }) {

  // Read the Kibana API integration tests config file so that we can utilize its services.
  const kibanaAPITestsConfig = await readConfigFile(resolveKibanaPath('test/api_integration/config.js'));
  const xPackFunctionalTestsConfig = await readConfigFile(require.resolve('../functional/config.js'));
  const kibanaFunctionalConfig = await readConfigFile(resolveKibanaPath('test/functional/config.js'));

  return {
    testFiles: [require.resolve('./apis')],
    servers: xPackFunctionalTestsConfig.get('servers'),
    services: {
      supertest: kibanaAPITestsConfig.get('services.supertest'),
      supertestWithoutAuth: SupertestWithoutAuthProvider,
      es: kibanaFunctionalConfig.get('services.es'),
      esArchiver: kibanaFunctionalConfig.get('services.esArchiver'),
    },
    esArchiver: xPackFunctionalTestsConfig.get('esArchiver'),
    junit: {
      reportName: 'X-Pack API Integration Tests',
    },
  };
}
