module.exports = function (server) {
  server.route({
    path: '/api/graphui-plugin/getIndices',
    method: 'GET',
    handler: function (req, reply) {
        var body={};
        var callWithRequest = server.plugins.elasticsearch.callWithRequest;
        //  See https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
          callWithRequest(req, 'indices.getSettings', body).then(function (resp) {
          reply({
            ok: true,
            indices:resp
          });
        }).catch(function (resp) {
          reply({
            ok: false,
            resp: resp
          });
        });


    }
  });


}
