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

  if(message.m === 'ready'){
    worker.ready = true;
  }

  if(message.m === 'open'){
    worker.open = true;
  }

  if(message.m === 'getroom'){
    var room = false;

    for(let i=0; i<workers.length; i++){
      if(workers[i].type === 'game' && workers[i].open){
        room = workers[i];
        break;
      }
    }

    if(room === false){
      log('No open game rooms, I\'m making a new one!');
      var id = workers.length;
      var port = GV.server.gameport + id;
      room = makeWorker(id, 'game', port);
    }

    room.open = false;
    worker.send({m: 'getroom', port: room.port, name: room.name, id: room.wid});
  }

  if(message.m === 'pass'){
    if(message.to === 'server'){ // braodcast to all servers
      workers.forEach((e,i)=>{
        if(e.type === 'server')
          e.send(message.data);
      });
    }else if(message.to === 'game'){ // broadcast to all game rooms
      workers.forEach((e,i)=>{
        if(e.type === 'game')
          e.send(message.data);
      });
    }else if(message.to === 'all'){
      workers.forEach((e,i)=>{
        e.send(message.data);
      });
    }else{
      workers[message.to].send(message.data);
    }
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

  for (let i = 0; i < numCores; i++) {
    makeWorker(i, 'server', GV.server.serverport);
  }
  cluster.on('message', (w, m, h)=> {
    workerMessage(w, m, h);
  });
  cluster.on('exit', (w, c, s)=> {
    workerExit(w, c, s);
  });
};

