import expect from 'expect.js';
import { omit } from 'lodash';

export default function ({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const pipelineList = getService('pipelineList');
  const pipelineEditor = getService('pipelineEditor');
  const PageObjects = getPageObjects(['logstash']);

  describe('pipeline list route', () => {
    before(async () => {
      await esArchiver.load('logstash/example_pipelines');
      await kibanaServer.waitForStabilization();
      await PageObjects.logstash.gotoPipelineList();
    });

    after(async () => {
      await esArchiver.unload('logstash/example_pipelines');
    });

    it('shows example pipelines', async () => {
      const rows = await pipelineList.getRowsFromTable();
      const rowsWithoutTime = rows.map(row => omit(row, 'lastModified'));

      for (const time of rows.map(row => row.lastModified)) {
        // last modified is a relative time string. Check for 'ago' suffix
        expect(time).to.be.a('string').match(/ ago$/);
      }

      expect(rowsWithoutTime).to.eql([
        {
          selected: false,
          id: 'empty_pipeline',
          description: 'an empty pipeline',
          username: 'elastic',
          version: ''
        },
        {
          selected: false,
          id: 'tweets_and_beats',
          description: 'ingest tweets and beats',
          username: 'elastic',
          version: ''
        }
      ]);
    });

    describe('select all checkbox', () => {
      it('toggles selection for all rows', async () => {
        // select all
        await pipelineList.clickSelectAll();

        for (const row of await pipelineList.getRowsFromTable()) {
          expect(row).to.have.property('selected', true);
        }

        // unselect all
        await pipelineList.clickSelectAll();

        for (const row of await pipelineList.getRowsFromTable()) {
          expect(row).to.have.property('selected', false);
        }
      });
    });

    describe('add button', () => {
      it('links to the empty pipeline editor', async () => {
        await pipelineList.clickAdd();
        await pipelineEditor.assertExists();
        await pipelineEditor.assertDefaultInputs();
      });

      after(async () => {
        await PageObjects.logstash.gotoPipelineList();
      });
    });

    describe('delete button', () => {
      it('is disabled when no rows are selected', async () => {
        await pipelineList.deselectAllRows();
        await pipelineList.assertDeleteButton({ enabled: false });
      });

      it('is enabled when all rows are selected', async () => {
        await pipelineList.selectAllRows();
        await pipelineList.assertDeleteButton({ enabled: true });
      });

      it('is enabled when a random row is selected', async () => {
        await pipelineList.deselectAllRows();
        await pipelineList.selectRandomRow();
        await pipelineList.assertDeleteButton({ enabled: true });
      });
    });

    describe('filter', () => {
      it('filters the pipeline list', async () => {
        await pipelineList.setFilter('tweets');
        const rows = await pipelineList.getRowsFromTable();

        expect(rows).to.have.length(1);
        expect(rows[0]).to.have.property('id', 'tweets_and_beats');
      });
    });

    describe('row links', () => {
      it('opens the selected row in the editor', async () => {
        await pipelineList.setFilter('tweets_and_beats');
        await pipelineList.clickFirstRowId();
        await pipelineEditor.assertExists();
        await pipelineEditor.assertEditorId('tweets_and_beats');
      });
    });
  });
}
