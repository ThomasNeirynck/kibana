import d3 from 'd3';
import _ from 'lodash';
import control from 'plugins/tagcloud/vis/components/control/events';
import layoutGenerator from 'plugins/tagcloud/vis/components/layout/generator';
import chartGenerator from 'plugins/tagcloud/vis/components/visualization/generator';

function vis() {

  let events = control();
  let layout = layoutGenerator();
  let chart = chartGenerator();
  let opts = {};
  let listeners = {};
  let size = [250, 250];

  function generator(selection) {
    selection.each(function () {
      events.listeners(listeners);

      layout.attr({
        type: opts.layout || 'grid',
        columns: opts.numOfColumns || 0,
        size: size
      });

      chart.options(opts);

      d3.select(this)
        .attr('width', '100%')
        .attr('height', size[1])
        .call(events)
        .call(layout)
        .selectAll('g.chart')
        .call(chart);
    });
  }

  // Public API
  generator.options = function (v) {
    opts = _.isPlainObject(v) ? v : opts;
    return generator;
  };

  generator.listeners = function (v) {
    listeners = _.isPlainObject(v) ? v : listeners;
    return generator;
  };

  generator.size = function (v) {
    if (!arguments.length) { return size; }
    size = (_.isArray(v) && _.size(v) === 2) ? v : size;
    return generator;
  };

  return generator;
}

export default vis;
