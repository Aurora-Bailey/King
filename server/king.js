'use strict';

var cluster = require('cluster');

if (cluster.isMaster) {
  var Master = require('./Master');
  Master.setup(cluster);

} else {
  var MongoDB = require('./MongoDB');
  MongoDB.connectToServer(function (err) {
    if (err) {
      console.log('MongoDB Error: ')
      console.log(err)
    } else {
      if(process.env.WORKER_TYPE == 'server') {
        var Server = require('./Server');
        Server.setup(process);
      }else if(process.env.WORKER_TYPE == 'game_classic'){
        var Classic = require('./games/Classic');
        Classic.setup(process);
      }else if(process.env.WORKER_TYPE == 'game_cities'){
        var Cities = require('./games/Cities');
        // Cities.setup(process);
      }else if(process.env.WORKER_TYPE == 'god'){
        var God = require('./God');
        God.setup(process);
      }
    }
  });
}



