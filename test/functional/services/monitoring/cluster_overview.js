export function MonitoringClusterOverviewProvider({ getService }) {
  const testSubjects = getService('testSubjects');

  const SUBJ_CLUSTER_ALERTS   = `clusterAlertsContainer`;
  const SUBJ_CLUSTER_OVERVIEW = 'clusterOverviewContainer';
  const SUBJ_CLUSTER_NAME     = `${SUBJ_CLUSTER_OVERVIEW} clusterName`;

  const SUBJ_ES_PANEL             = `clusterItemContainerElasticsearch`;
  const SUBJ_ES_STATUS            = `${SUBJ_ES_PANEL} statusIcon`;
  const SUBJ_ES_VERSION           = `${SUBJ_ES_PANEL} esVersion`;
  const SUBJ_ES_UPTIME            = `${SUBJ_ES_PANEL} esUptime`;
  const SUBJ_ES_NUMBER_OF_NODES   = `${SUBJ_ES_PANEL} esNumberOfNodes`;
  const SUBJ_ES_DISK_AVAILABLE    = `${SUBJ_ES_PANEL} esDiskAvailable`;
  const SUBJ_ES_JVM_HEAP          = `${SUBJ_ES_PANEL} esJvmHeap`;
  const SUBJ_ES_NUMBER_OF_INDICES = `${SUBJ_ES_PANEL} esNumberOfIndices`;
  const SUBJ_ES_DOCUMENTS_COUNT   = `${SUBJ_ES_PANEL} esDocumentsCount`;
  const SUBJ_ES_DISK_USAGE        = `${SUBJ_ES_PANEL} esDiskUsage`;
  const SUBJ_ES_PRIMARY_SHARDS    = `${SUBJ_ES_PANEL} esPrimaryShards`;
  const SUBJ_ES_REPLICA_SHARDS    = `${SUBJ_ES_PANEL} esReplicaShards`;
  const SUBJ_ES_ML_JOBS           = `${SUBJ_ES_PANEL} esMlJobs`;

  const SUBJ_KBN_PANEL             = `clusterItemContainerKibana`;
  const SUBJ_KBN_STATUS            = `${SUBJ_KBN_PANEL} statusIcon`;
  const SUBJ_KBN_REQUESTS          = `${SUBJ_KBN_PANEL} kbnRequests`;
  const SUBJ_KBN_MAX_RESPONSE_TIME = `${SUBJ_KBN_PANEL} kbnMaxResponseTime`;
  const SUBJ_KBN_INSTANCES         = `${SUBJ_KBN_PANEL} kbnInstances`;
  const SUBJ_KBN_CONNECTIONS       = `${SUBJ_KBN_PANEL} kbnConnections`;
  const SUBJ_KBN_MEMORY_USAGE      = `${SUBJ_KBN_PANEL} kbnMemoryUsage`;

  const SUBJ_LS_PANEL           = `clusterItemContainerLogstash`;
  const SUBJ_LS_EVENTS_RECEIVED = `${SUBJ_LS_PANEL} lsEventsReceived`;
  const SUBJ_LS_EVENTS_EMITTED  = `${SUBJ_LS_PANEL} lsEventsEmitted`;
  const SUBJ_LS_NODES           = `${SUBJ_LS_PANEL} lsNodes`;
  const SUBJ_LS_UPTIME          = `${SUBJ_LS_PANEL} lsUptime`;
  const SUBJ_LS_JVM_HEAP        = `${SUBJ_LS_PANEL} lsJvmHeap`;
  const SUBJ_LS_PIPELINES       = `${SUBJ_LS_PANEL} lsPipelines`;

  return new class ClusterOverview {

    async isOnClusterOverview() {
      return testSubjects.exists(SUBJ_CLUSTER_OVERVIEW);
    }
    async getClusterName() {
      return testSubjects.getVisibleText(SUBJ_CLUSTER_NAME);
    }

    async doesClusterAlertsExist() {
      return testSubjects.exists(SUBJ_CLUSTER_ALERTS);
    }

    async getEsStatus() {
      const statusIcon = await testSubjects.find(SUBJ_ES_STATUS);
      return statusIcon.getProperty('alt');
    }
    async getEsVersion() {
      return testSubjects.getVisibleText(SUBJ_ES_VERSION);
    }
    async getEsUptime() {
      return testSubjects.getVisibleText(SUBJ_ES_UPTIME);
    }
    async getEsNumberOfNodes() {
      return testSubjects.getVisibleText(SUBJ_ES_NUMBER_OF_NODES);
    }
    async getEsDiskAvailable() {
      return testSubjects.getVisibleText(SUBJ_ES_DISK_AVAILABLE);
    }
    async getEsJvmHeap() {
      return testSubjects.getVisibleText(SUBJ_ES_JVM_HEAP);
    }
    async getEsNumberOfIndices() {
      return testSubjects.getVisibleText(SUBJ_ES_NUMBER_OF_INDICES);
    }
    async getEsDocumentsCount() {
      return testSubjects.getVisibleText(SUBJ_ES_DOCUMENTS_COUNT);
    }
    async getEsDiskUsage() {
      return testSubjects.getVisibleText(SUBJ_ES_DISK_USAGE);
    }
    async getEsPrimaryShards() {
      return testSubjects.getVisibleText(SUBJ_ES_PRIMARY_SHARDS);
    }
    async getEsReplicaShards() {
      return testSubjects.getVisibleText(SUBJ_ES_REPLICA_SHARDS);
    }

    async clickEsIndices() {
      return testSubjects.click(SUBJ_ES_NUMBER_OF_INDICES);
    }

    async doesEsMlJobsExist() {
      return testSubjects.exists(SUBJ_ES_ML_JOBS);
    }
    async getEsMlJobs() {
      return testSubjects.getVisibleText(SUBJ_ES_ML_JOBS);
    }

    async doesKbnPanelExist() {
      return testSubjects.exists(SUBJ_KBN_PANEL);
    }
    async getKbnStatus() {
      const statusIcon = await testSubjects.find(SUBJ_KBN_STATUS);
      return statusIcon.getProperty('alt');
    }
    async getKbnRequests() {
      return testSubjects.getVisibleText(SUBJ_KBN_REQUESTS);
    }
    async getKbnMaxResponseTime() {
      return testSubjects.getVisibleText(SUBJ_KBN_MAX_RESPONSE_TIME);
    }
    async getKbnInstances() {
      return testSubjects.getVisibleText(SUBJ_KBN_INSTANCES);
    }
    async getKbnConnections() {
      return testSubjects.getVisibleText(SUBJ_KBN_CONNECTIONS);
    }
    async getKbnMemoryUsage() {
      return testSubjects.getVisibleText(SUBJ_KBN_MEMORY_USAGE);
    }

    async doesLsPanelExist() {
      return testSubjects.exists(SUBJ_LS_PANEL);
    }
    async getLsEventsReceived() {
      return testSubjects.getVisibleText(SUBJ_LS_EVENTS_RECEIVED);
    }
    async getLsEventsEmitted() {
      return testSubjects.getVisibleText(SUBJ_LS_EVENTS_EMITTED);
    }
    async getLsNodes() {
      return testSubjects.getVisibleText(SUBJ_LS_NODES);
    }
    async getLsUptime() {
      return testSubjects.getVisibleText(SUBJ_LS_UPTIME);
    }
    async getLsJvmHeap() {
      return testSubjects.getVisibleText(SUBJ_LS_JVM_HEAP);
    }
    async getLsPipelines() {
      return testSubjects.getVisibleText(SUBJ_LS_PIPELINES);
    }

  };
}
