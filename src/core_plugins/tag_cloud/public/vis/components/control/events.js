import d3 from 'd3';
import _ from 'lodash';

// Adds event listeners to DOM elements
function events() {
  let processor = function (e) { return e; };
  let listeners = {};
  let svg;

  function control(selection) {
    selection.each(function () {
      svg = d3.select(this);

      d3.entries(listeners).forEach(function (d) {
        svg.on(d.key, function () {
          d3.event.stopPropagation(); // => event.stopPropagation()

          _.forEach(d.value, function (listener) {
            listener.call(this, processor(d3.event));
          });
        });
      });
    });
  }

  // Public API
  control.listeners = function (v) {
    if (!arguments.length) { return listeners; }
    listeners = _.isPlainObject(v) ? v : listeners;
    return control;
  };

  return control;
}

export default events;
