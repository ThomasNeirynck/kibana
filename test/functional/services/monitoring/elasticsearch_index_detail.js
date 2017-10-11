export function MonitoringElasticsearchIndexDetailProvider({ getService }) {
  const testSubjects = getService('testSubjects');

  const SUBJ_SUMMARY = 'elasticsearchIndexSummaryStatus';
  const SUBJ_SUMMARY_DATA_SIZE           = `${SUBJ_SUMMARY} dataSize`;
  const SUBJ_SUMMARY_DATA_SIZE_PRIMARIES = `${SUBJ_SUMMARY} dataSizePrimaries`;
  const SUBJ_SUMMARY_DOCUMENT_COUNT      = `${SUBJ_SUMMARY} documentCount`;
  const SUBJ_SUMMARY_TOTAL_SHARDS        = `${SUBJ_SUMMARY} totalShards`;
  const SUBJ_SUMMARY_UNASSIGNED_SHARDS   = `${SUBJ_SUMMARY} unassignedShards`;
  const SUBJ_SUMMARY_HEALTH              = `${SUBJ_SUMMARY} statusIcon`;

  return new class ElasticsearchIndexDetail {

    async getSummary() {
      return {
        dataSize: await testSubjects.getVisibleText(SUBJ_SUMMARY_DATA_SIZE),
        dataSizePrimaries: await testSubjects.getVisibleText(SUBJ_SUMMARY_DATA_SIZE_PRIMARIES),
        documentCount: await testSubjects.getVisibleText(SUBJ_SUMMARY_DOCUMENT_COUNT),
        totalShards: await testSubjects.getVisibleText(SUBJ_SUMMARY_TOTAL_SHARDS),
        unassignedShards: await testSubjects.getVisibleText(SUBJ_SUMMARY_UNASSIGNED_SHARDS),
        health: await testSubjects.getProperty(SUBJ_SUMMARY_HEALTH, 'alt'),
      };
    }

  };
}
