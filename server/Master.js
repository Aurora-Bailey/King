'use strict';

var os = require('os'),
  numCores = os.cpus().length,
  GV = require('./Globalvar'),
  Lib = require('./Lib'),
  uptime = Date.now(),
  cluster = false,
  workers = [];

function workerMessage(worker, message, handle) {
  if (arguments.length === 2) {
    handle = message;
    message = worker;
    worker = undefined;
  }

  // God commands
  if (message.m === "getstats"){
    try {
      let numObj = {};
      workers.forEach((e, i)=>{
        if (typeof numObj[e.type] === 'undefined') numObj[e.type] = 1;
        else numObj[e.type]++;
      });

      // Loop response back to be sent through the pass function
      workerMessage(worker, {
        m: 'pass',
        to: message.rid,
        data: {
          m: 'godmsg',
          s: message.sid,
          msg: '[master] mv:' + GV.mv + ' Uptime:' + Lib.humanTimeDiff(uptime, Date.now()) + ' Nodes:' + JSON.stringify(numObj)
        }
      }, handle);
    } catch(err) {
      log('err', 'I failed to send stats to god.');
      console.log(err);
    }
  }
  if (message.m === "masterstats"){
    try {
      workers.forEach((e, i)=>{
        workerMessage(worker, {
          m: 'pass',
          to: message.rid,
          data: {
            m: 'godmsg',
            s: message.sid,
            msg: 'ID: ' + e.wid + ' Name: ' + e.name + ' Type: ' + e.type + ' Port: ' + e.port + ' Ready: ' + e.ready + ' Open: ' + e.open
          }
        }, handle);
      });
    } catch(err) {
      log('err', 'I failed to send master stats to god.');
      console.log(err);
    }
  }
  // End god commands

  if(message.m === 'ready'){
    worker.ready = true;
  } else if(message.m === 'open'){
    worker.open = true;
  } else if(message.m === 'getroom'){
    var room = false;

    for(let i=0; i<workers.length; i++){
      if(workers[i].type === message.type && workers[i].open){
        room = workers[i];
        break;
      }
    }

    if(room === false){
      // log('worker', 'No open ' + message.type + ' rooms, I\'m making a new one!');
      var id = workers.length;
      var port = GV.server.gameport + id;
      room = makeWorker(id, message.type, port);
    }

    if(room === false){
      // Still no room
      log('workerfull', '!!! Failed to make room ' + message.type + ' ' + workers.length + ', Must be full.');
      worker.send({m: 'getroom', fail: true});
    } else {
      room.open = false;
      worker.send({m: 'getroom', port: room.port, name: room.name, id: room.wid, type: message.type});
    }
  }else if(message.m === 'pass') { // to: id || type || 'all'
    try {
      workers.forEach((e, i)=> {
        if (e.type === message.to || e.wid == message.to || 'all' === message.to) {// Make sure type id and all are distinct
          if(e.ready) e.send(message.data);
          else setTimeout(()=>{e.send(message.data)}, 1000);// give a second of not ready
        }
      });

      // Loop a copy back to master
      if (message.to === 'master' || message.to === 'all') {
        workerMessage(worker, message.data, handle)
      }
    }catch(err){
      log('err', 'Failed to pass message to worker!');
      console.log(err);
    }
  }else if(message.m === 'kill') {
    try {
      workers.forEach((e, i)=> {
        if (e.type === message.worker || e.wid == message.worker || 'all' === message.worker) {// Make sure type id and all are distinct
          e.kill('SIGKILL');
        }
      });
    }catch(err){
      log('err', 'Failed kill worker!');
      console.log(err);
    }
  }
}
function workerExit(worker, code, signal) {
  log('workerdead', 'Worker died ' + worker.wid);
  makeWorker(worker.wid, worker.type, worker.port);
}
function makeWorker(id, type, port) {
  if (!cluster) return false;

  // this may cause problems for servers that request a room but don't get one
  // but we only have names for about 200 nodes
  // nginx routes the name to a port
  if (id >= GV.server.roomNameList.length) return false;
  let name = GV.server.roomNameList[id];

  // log('worker', 'Making worker ' + id + '-' + name + ' ' + type);
  workers[id] = cluster.fork({WORKER_INDEX: id, WORKER_PORT: port, WORKER_TYPE: type, WORKER_NAME: name});
  workers[id].ready = false;
  workers[id].open = true;// used for game room, false when waiting on server. true when game is over and no server claims it.
  workers[id].wid = id;
  workers[id].port = port;
  workers[id].type = type;
  workers[id].name = name;

  return workers[id];
}

function log(cat, msg){
  try {
    if(typeof msg === 'object') {
      msg = JSON.stringify(msg);
    }

    let x = {cat, time: Date.now(), room: 'master', msg: msg}

    // force message through the same way nodes do.
    if (!workers[0].isDead()) workerMessage(workers[0], {m: 'pass', to: 'god', data: {m: 'godlog', data: x}}, 'handle?');
  }catch(err){
    console.log(err);
  }
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

