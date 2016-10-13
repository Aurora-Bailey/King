'use strict';

var cluster = require('cluster');

if (cluster.isMaster) {
  var Master = require('./Master');
  Master.setup(cluster);

} else {
  var MongoDB = require('./MongoDB');
  MongoDB.connectToServer(function (err) {
    if (err) {
      console.log('MongoDB Error: ', err)
    } else {
      if(process.env.WORKER_TYPE == 'server') {
        var Server = require('./Server');
        Server.setup(process);
      }else if(process.env.WORKER_TYPE == 'game_classic'){
        var Game = require('./games/Classic');
        Game.setup(process);
      }else if(process.env.WORKER_TYPE == 'god'){
        var God = require('./God');
        God.setup(process);
      }
    }
  });
}



