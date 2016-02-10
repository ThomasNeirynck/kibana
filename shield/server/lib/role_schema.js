const Joi = require('joi');

module.exports = {
  name: Joi.string().required(),
  cluster: Joi.array().items(Joi.string()),
  indices: Joi.array().items({
    names: Joi.array().items(Joi.string()),
    fields: Joi.array().items(Joi.string()),
    privileges: Joi.array().items(Joi.string()),
    query: Joi.string()
  }),
  run_as: Joi.string()
};