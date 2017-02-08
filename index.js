import main from './plugins/xpack_main';
import graph from './plugins/graph';
import monitoring from './plugins/monitoring';
import { reporting } from './plugins/reporting';
import security from './plugins/security';
import searchprofiler from './plugins/searchprofiler';
import tilemap from './plugins/tilemap';
import ml from './plugins/ml';

module.exports = function (kibana) {
  return [
    main(kibana),
    graph(kibana),
    monitoring(kibana),
    reporting(kibana),
    security(kibana),
    searchprofiler(kibana),
    ml(kibana),
    tilemap(kibana)
  ];
};
