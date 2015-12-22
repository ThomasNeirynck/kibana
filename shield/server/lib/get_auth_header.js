module.exports = function getAuthHeader(username, password) {
  const auth = new Buffer(`${username}:${password}`).toString('base64');
  return {authorization: `Basic ${auth}`};
};