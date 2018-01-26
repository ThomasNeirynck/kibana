import expect from 'expect.js';
import { getLifecycleMethods } from '../_get_lifecycle_methods';

export default function ({ getService, getPageObjects }) {
  const clusterOverview = getService('monitoringClusterOverview');
  const overview = getService('monitoringBeatsOverview');
  const beatsSummaryStatus = getService('monitoringBeatsSummaryStatus');

  describe('monitoring/beats-overview', () => {
    const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

    before(async () => {
      await setup('monitoring/beats', {
        from: '2017-12-19 17:15:09.302',
        to: '2017-12-19 18:15:09.302',
      });

      // go to beats overview
      await clusterOverview.clickBeatsOverview();
      expect(await overview.isOnOverview()).to.be(true);
    });

    after(async () => {
      await tearDown();
    });

    it('shows no recent activity', async () => {
      expect(await overview.noRecentActivityMessageIsShowing()).to.be(true);
    });

    it('cluster status bar shows correct information', async () => {
      expect(await beatsSummaryStatus.getContent()).to.eql({
        filebeat: 200,
        heartbeat: 100,
        metricbeat: 100,
        cowbeat: 1,
        duckbeat: 1,
        sheepbeat: 1,
        winlogbeat: 1,
        totalEvents: '699.9k',
        bytesSent: '428MB',
      });
    });

  });
}
