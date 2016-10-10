'use strict';

var http = require('http'),
  express = require('express'),
  WebSocketServer = require('ws').Server,
  server = http.createServer(),
  db = require('./MongoDB').getDb(),
  Lib = require('./Lib'),
  GV = require('./Globalvar'),
  wss = new WebSocketServer({server: server}),
  app = express(),
  process = false,
  uptime = Date.now(),
  WORKER_PORT = false,
  WORKER_NAME = false,
  WORKER_INDEX = false,
  NODE_ENV = false;


var sniffers = {
  list: [],
  add: function(sniffer){
    let alreadySniffing = false;
    this.list.forEach((e,i)=>{
      if (e.sid == sniffer.sid) alreadySniffing = true;
    });

    if(!alreadySniffing){
      this.list.push(sniffer);
      try {
        process.send({
          m: 'pass',
          to: sniffer.rid,
          data: {
            m: 'godmsg',
            s: sniffer.sid,
            msg: '[' + Lib.humanTimeDate(Date.now()) + '] [' + WORKER_INDEX + '-' + WORKER_NAME + '] [god] ' + ' Sniffing Activated!'
          }
        });
      } catch(err) {
        console.log(err);
      }
    }
  },
  remove: function(sniffer){
    for(let i=0; i<this.list.length; i++){
      if (this.list[i].sid == sniffer.sid){
        this.list.splice(i, 1);
        i--;
        try {
          process.send({
            m: 'pass',
            to: sniffer.rid,
            data: {
              m: 'godmsg',
              s: sniffer.sid,
              msg: '[' + Lib.humanTimeDate(Date.now()) + '] [' + WORKER_INDEX + '-' + WORKER_NAME + '] [god] ' + ' Sniffing De-Activated!'
            }
          });
        } catch(err) {
          console.log(err);
        }
      }
    }
  }
};

/* Websockets */
function nameClients() {
  let names = '';
  wss.clients.forEach(function each(client) {
    names += '[' + client.name + ' ' + client.mod + ' ' + Lib.humanTimeDiff(client.start, Date.now()) + '] ';
  });
  return names;
}
function sendToSid(sid, obj) {
  wss.clients.forEach(function each(client) {
    if (client.sid === sid) client.sendObj(obj);
  });
}
function handleMessage(ws, d) {// websocket client messages
  try{
    if (d.m === 'hi') {
      //ws.sendObj({m: 'hi'});
    } else if (d.m === 'cookie') {
      db.collection('players').find({cookie: d.cookie}, {_id: 0, mod: 1, name: 1}).limit(1).toArray(function(err, docs) {
        if (err) {
          ws.sendObj({m: 'output', msg: 'Bad Cookie!'});
          log('Error with mongodb cookie request');
          console.log(err);
        } else if (docs.length != 0) {
          //User WAS found
          ws.name = docs[0].name;
          if (typeof docs[0].mod !== 'undefined') ws.mod = docs[0].mod;
          else ws.mod = 'peasant';

          ws.sendObj({m: 'output', msg: 'Welcome ' + ws.mod.toUpperCase() + ' ' + ws.name});
        } else {
          ws.sendObj({m: 'output', msg: 'Bad Cookie!'});
        }
      });
    }else if (d.m === 'input') {

      // Firewall
      if (ws.mod !== 'god'){
        ws.sendObj({m: 'output', msg: 'Bad Egg!'});
        return false;
      }

      ws.sendObj({m: 'output', msg: '---> ' + d.msg});

      let query = d.msg.split(' ');

      // First word
      if (typeof query[0] !== 'undefined') {

        // status
        if (query[0] === 'status') {

          // Second word
          if (typeof query[1] !== 'undefined') {
            // send to specific node or type
            ws.sendObj({m: 'output', msg: '=== Pulling status from ' + query[1] + ' ==='});
            process.send({m: 'pass', to: query[1], data: {m: 'getstats', rid: WORKER_INDEX, sid: ws.sid}});
          } else {
            // No arguments
            ws.sendObj({m: 'output', msg: '=== Pulling status from every node ==='});
            process.send({m: 'pass', to: 'all', data: {m: 'getstats', rid: WORKER_INDEX, sid: ws.sid}});
          }
        }

        // sniff
        if (query[0] === 'sniff') {

          // Second word
          if (typeof query[1] !== 'undefined') {
            // send to specific node or type
            ws.sendObj({m: 'output', msg: '=== Sniffing ' + query[1] + ' ==='});
            process.send({m: 'pass', to: query[1], data: {m: 'sniff', rid: WORKER_INDEX, sid: ws.sid}});
          } else {
            // No arguments
            ws.sendObj({m: 'output', msg: '=== Sniffing every node ==='});
            process.send({m: 'pass', to: 'all', data: {m: 'sniff', rid: WORKER_INDEX, sid: ws.sid}});
          }
        }
        // unsniff
        if (query[0] === 'unsniff') {

          // Second word
          if (typeof query[1] !== 'undefined') {
            // send to specific node or type
            ws.sendObj({m: 'output', msg: '=== Unsniffing ' + query[1] + ' ==='});
            process.send({m: 'pass', to: query[1], data: {m: 'unsniff', rid: WORKER_INDEX, sid: ws.sid}});
          } else {
            // No arguments
            ws.sendObj({m: 'output', msg: '=== Unsniffing every node ==='});
            process.send({m: 'pass', to: 'all', data: {m: 'unsniff', rid: WORKER_INDEX, sid: ws.sid}});
          }
        }

        // snoop
        // currently only game rooms listen for this.
        if (query[0] === 'snoop') {

          // Second word
          if (typeof query[1] !== 'undefined') {
            // send to specific node or type
            ws.sendObj({m: 'output', msg: '=== snooping ' + query[1] + ' ==='});
            process.send({m: 'pass', to: query[1], data: {m: 'snoop', rid: WORKER_INDEX, sid: ws.sid}});
          } else {
            // No arguments
            ws.sendObj({m: 'output', msg: '=== snooping every node ==='});
            process.send({m: 'pass', to: 'all', data: {m: 'snoop', rid: WORKER_INDEX, sid: ws.sid}});
          }
        }
        // unsnoop
        if (query[0] === 'unsnoop') {

          // Second word
          if (typeof query[1] !== 'undefined') {
            // send to specific node or type
            ws.sendObj({m: 'output', msg: '=== Unsnooping ' + query[1] + ' ==='});
            process.send({m: 'pass', to: query[1], data: {m: 'unsnoop', rid: WORKER_INDEX, sid: ws.sid}});
          } else {
            // No arguments
            ws.sendObj({m: 'output', msg: '=== Unsnooping every node ==='});
            process.send({m: 'pass', to: 'all', data: {m: 'unsnoop', rid: WORKER_INDEX, sid: ws.sid}});
          }
        }

        // chatlogs
        // pull chat logs from node

        // chat
        // send message to a game room chat

        // nodes
        if (query[0] === 'nodes') {
          process.send({m: 'getnodetotal', s: ws.sid});
        }

        // help
        if (query[0] === 'help') {
          ws.sendObj({m: 'output', msg: 'status [id/type/all] - Status of every node. Options specific node/s'});
          ws.sendObj({m: 'output', msg: 'sniff [id/type/all] - Real time logs from every node. Options specific node/s'});
          ws.sendObj({m: 'output', msg: 'unsniff [id/type/all] - Stop real time logs from every node. Options specific node/s'});
          ws.sendObj({m: 'output', msg: 'snoop [id/type/all] - Real time chat from every node. Options specific node/s'});
          ws.sendObj({m: 'output', msg: 'unsnoop [id/type/all] - Stop real time chat from every node. Options specific node/s'});
          ws.sendObj({m: 'output', msg: 'nodes - Number of each type of node.'});
        }
      }

    }
    // Example broadcast to all nodes
    // process.send({m: 'pass', to: 'server', data: {m: 'broadcast', message: d.message, level: d.level}});
  }catch(err){
    console.log(d);
    console.log(err);
  }
}

/* General */
function log(msg){
  if(typeof msg === 'object') {
    msg = JSON.stringify(msg);
  }
  console.log('[' + Lib.humanTimeDate(Date.now()) + ']GOD--------------Worker ' + WORKER_INDEX + ': ' + msg);
  sniffers.list.forEach((e,i)=>{
    try {
      process.send({
        m: 'pass',
        to: e.rid,
        data: {
          m: 'godmsg',
          s: e.sid,
          msg: '[' + Lib.humanTimeDate(Date.now()) + '] [' + WORKER_INDEX + '-' + WORKER_NAME + '] [god] ' + msg
        }
      });
    } catch(err) {
      console.log(err);
    }
  });
}

/* Setup */
module.exports.setup = function (p) {
  process = p;
  WORKER_INDEX = process.env.WORKER_INDEX;
  WORKER_PORT = process.env.WORKER_PORT;
  WORKER_NAME = process.env.WORKER_NAME;
  NODE_ENV = process.env.NODE_ENV;
  log('Hi I\'m worker ' + WORKER_INDEX + ' running as a GOD server. {' + WORKER_NAME + '}{' + NODE_ENV + '}');
  log('Version: ' + GV.version);

  process.on('message', function (m) {// process server messages
    if (m.m === "godmsg") {
      sendToSid(m.s, {m: 'output', msg: m.msg});
    }else if (m.m === "getstats"){
      try {
        process.send({
          m: 'pass',
          to: m.rid,
          data: {
            m: 'godmsg',
            s: m.sid,
            msg: '[' + WORKER_INDEX + '-' + WORKER_NAME + '] [god]' + ' Uptime:' + Lib.humanTimeDiff(uptime, Date.now()) + ' Clients:' + wss.clients.length + ' Names:' + nameClients()
          }
        });
      } catch(err) {
        log('I failed to send stats to god.');
        console.log(err);
      }
    }else if (m.m === "sniff"){
      try {
        sniffers.add({rid: m.rid, sid: m.sid});
      } catch(err) {
        log('I failed to add sniffer.');
        console.log(err);
      }
    }else if (m.m === "unsniff"){
      try {
        sniffers.remove({rid: m.rid, sid: m.sid});
      } catch(err) {
        log('I failed to remove sniffer.');
        console.log(err);
      }
    }
  });

  wss.on('connection', function connection(ws) {
    ws.on('error', function(e) { log('Got a ws error'); return false; });

    // don't use ws.domain or ws.extensions
    ws.connected = true;
    ws.start = Date.now();
    ws.name = 'Unknown';
    ws.mod = false;
    ws.sid = Lib.md5(Math.random() + Date.now());
    ws.sendObj = function (obj) {
      if(!ws.connected) return false;

      try {
        ws.send(JSON.stringify(obj));
      } catch (err) {
        log('I failed to send a message.');
      }
    };
    ws.on('message', function incoming(data) {
      try {
        var d = JSON.parse(data);
        handleMessage(ws, d);
      }
      catch (err) {
        log('HACKER!!! AKA bad client message.');
        console.log(data);
        console.log(err);
      }
    });

    ws.on('close', function () {
      log(ws.name + ' has left.');
      handleMessage(ws, {m: 'input', msg: 'unsniff'}); // Clean up
      ws.connected = false;
    });

    ws.sendObj({m: 'hi'});
  });

  app.use(function (req, res) {// This is sent when the WebSocket is requested as a web page
    try {
      res.send('WebSocket -_- ' + WORKER_INDEX);
    } catch (err) {
      log('I failed to send a http request.');
      console.log(err);
    }
  });

  server.on('request', app);
  server.listen(WORKER_PORT, function () {
    log( 'I\'m listening on port ' + server.address().port)
  });

  process.send({m: 'ready'});
};

