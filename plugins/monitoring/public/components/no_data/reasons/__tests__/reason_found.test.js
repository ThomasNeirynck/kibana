import React from 'react';
import { render } from 'enzyme';
import { ReasonFound } from '../';

const enabler = {};

describe('ReasonFound', () => {
  test('should load ExplainCollectionInterval component', () => {
    const component = render(
      <ReasonFound
        reason={{
          property: 'xpack.monitoring.collection.interval',
          data: '-1',
          context: 'cluster'
        }}
        enabler={enabler}
      />
    );
    expect(component).toMatchSnapshot();
  });

  test('should load ExplainExporters component', () => {
    const component = render(
      <ReasonFound
        reason={{
          property: 'xpack.monitoring.exporters',
          data: 'myMonitoringClusterExporter1',
          context: 'node001foo'
        }}
        enabler={enabler}
      />
    );
    expect(component).toMatchSnapshot();
  });

  test('should load ExplainPluginEnabled component', () => {
    const component = render(
      <ReasonFound
        reason={{
          property: 'xpack.monitoring.enabled',
          data: 'false',
          context: 'node001foo'
        }}
        enabler={enabler}
      />
    );
    expect(component).toMatchSnapshot();
  });
});
