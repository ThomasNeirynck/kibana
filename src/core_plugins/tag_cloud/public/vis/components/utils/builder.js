import d3 from 'd3';
import _ from 'lodash';

function builder(obj, func) {
  if (!_.isPlainObject(obj)) {
    throw new Error('builder expects a javascript Object ({}) as its first argument');
  }

  if (!_.isFunction(func)) {
    throw new Error('builder expects a function as its second argument');
  }

  d3.entries(obj).forEach(function (d) {
    if (_.isFunction(func[d.key])) {
      func[d.key](d.value);
    }
  });

  return func;
}

export default builder;
