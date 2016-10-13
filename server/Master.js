'use strict';

var os = require('os'),
  numCores = os.cpus().length,
  GV = require('./Globalvar'),
  Lib = require('./Lib'),
  cluster = false,
  workers = [];

function workerMessage(worker, message, handle) {
  if (arguments.length === 2) {
    handle = message;
    message = worker;
    worker = undefined;
  }

  // God commands
  if (message.m === 'getnodetotal'){
    let numObj = {};
    workers.forEach((e, i)=>{
      if (typeof numObj[e.type] === 'undefined') numObj[e.type] = 1;
      else numObj[e.type]++;
    });
    worker.send({m: 'godmsg', msg: JSON.stringify(numObj), s: message.s});
  }
  // End god commands

  if(message.m === 'ready'){
    worker.ready = true;
  } else if(message.m === 'open'){
    worker.open = true;
  } else if(message.m === 'getroom'){ // pass in type of rooom ====================================================================
    var room = false;

    for(let i=0; i<workers.length; i++){
      if(workers[i].type === message.type && workers[i].open){
        room = workers[i];
        break;
      }
    }

    if(room === false){
      log('No open ' + message.type + ' rooms, I\'m making a new one!');
      var id = workers.length;
      var port = GV.server.gameport + id;
      room = makeWorker(id, message.type, port);
    }

    if(room === false){
      // Still no room
      log('!!! Failed to get room ' + message.type + workers.length);
      worker.send({m: 'getroom', fail: true});
    } else {
      room.open = false;
      worker.send({m: 'getroom', port: room.port, name: room.name, id: room.wid, type: message.type});
    }
  }else if(message.m === 'pass') { // to: id || type || 'all'
    workers.forEach((e, i)=> {
      if (e.type === message.to || e.wid == message.to || 'all' === message.to) {// Make sure type id and all are distinct
        e.send(message.data);
      }
    });
  }

  // log('Worker ' + worker.wid + ': ' + JSON.stringify(message));
}
function workerExit(worker, code, signal) {
  log('worker died ' + worker.wid);
  makeWorker(worker.wid, worker.type, worker.port);
}
function makeWorker(id, type, port) {
  if (!cluster) return false;

  // this may cause problems for servers that request a room but don't get one
  // but we only have names for about 200 nodes
  // nginx routes the name to a port
  if (id >= GV.server.roomNameList.length) return false;
  let name = GV.server.roomNameList[id];

  log('Making worker ' + id);
  workers[id] = cluster.fork({WORKER_INDEX: id, WORKER_PORT: port, WORKER_TYPE: type, WORKER_NAME: name});
  workers[id].ready = false;
  workers[id].open = true;// used for game room, false when waiting on server. true when game is over and no server claims it.
  workers[id].wid = id;
  workers[id].port = port;
  workers[id].type = type;
  workers[id].name = name;

  return workers[id];
}

function log(msg){
  if(typeof msg === 'object') {
    msg = JSON.stringify(msg);
  }
  console.log('[' + Lib.humanTimeDate(Date.now()) + ']Master: ' + msg);
}

module.exports.setup = function (c) {
  cluster = c;

  // god server
  makeWorker(workers.length, 'god', GV.server.godport);

  for (let i = 0; i < numCores; i++) {
    makeWorker(workers.length, 'server', GV.server.serverport);
  }
  cluster.on('message', (w, m, h)=> {
    workerMessage(w, m, h);
  });
  cluster.on('exit', (w, c, s)=> {
    workerExit(w, c, s);
  });
};

