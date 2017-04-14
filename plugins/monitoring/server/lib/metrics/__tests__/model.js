import _ from 'lodash';

export function Model(data, options) {
  this.options = options || {};
  this.data = Model.explode(data);
}

Model.prototype.get = function (key) {
  return _.get(this.data, key);
};

Model.prototype.set = function (key, val) {
  const self = this;
  if (_.isPlainObject(key)) {
    _.each(Model.flatten(key), function (v, k) {
      _.get(self.data, k, v);
    });
  } else {
    _.set(this.data, key, val);
  }
};

Model.prototype.toObject = function (options) {
  options = _.defaults({}, options, this.options);
  let data = this.data;
  if (options.flatten) data = Model.flatten(data);
  return data;
};

Model.prototype.toJSON = function () {
  return this.data;
};

Model.stripEmpties = function (obj) {
  for (const i in obj) {
    if (_.isEmpty(obj[i])) {
      delete obj[i];
    } else if (typeof obj[i] === 'object') {
      Model.stripEmpties(obj[i]);
    }
  }
  return obj;
};

Model.flatten = function flatten(obj, path, newObj) {
  newObj = newObj || {};
  path = path || [];
  for (const i in obj) {
    if (_.isPlainObject(obj[i]) && !_.isArray(obj[i])) {
      flatten(obj[i], path.concat(i), newObj);
    } else {
      newObj[path.concat(i).join('.')] = obj[i];
    }
  }
  return newObj;
};

Model.explode = function explode(obj) {
  const newObj = {};
  _.each(obj, function (val, key) {
    _.set(newObj, key, val);
  });
  return newObj;
};
