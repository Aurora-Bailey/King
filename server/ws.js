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
      }else if(process.env.WORKER_TYPE == 'game'){
        var Game = require('./Game');
        Game.setup(process);
      }
    }
  });
}



