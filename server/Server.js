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
  WORKER_PORT = false,
  WORKER_INDEX = false,
  NODE_ENV = false;

function handleMessage(ws, d) {// websocket client messages
  if (d.m === 'login') {

  }

  // << hi
  // >> hi
  // << version compatible Lib.version()
  // >> true/false
  // << unique cookie id/ lack of cookie
  /* if no cookie, make one and store it in mondodb, then send it to the user*/
  // >> user stats
  /*logged in*/

  // << join game request
  // << set/update name
  /* add user to waiting queue, ignore if already in queue or playing*/
  // >> give update on num players and timeout

  /* when all spots are filled or timeout is hit */
  /* send master list of unique ids and user ids, master sends game room list of unique ids*/
  /* game room will return with 'running' when ready */
  // >> ip address with port, unique id string specific to game room
  /* set user to playing */

  // << game over
  // >> send new stats
  /* set user to not playing*/

  // >> broadcast message to all users, display as banner


  /* admin commands*/
  // << {m: 'broadcast', pass: 'l3rd9uwb', message: 'server will restart in 10 minutes', level: 'warn'}
  /* send to master, master sends to server nodes, server broadcasts */


//ws.sendObj(d);


  /*
   db.collection('asdf').insertOne({asdf: 'qqqqq', d: {f: 'aaaa', q: 'ads;flkj'}}, function(err, result){
   if(!err){
   console.log('no error');
   }
   });
   */
}
function log(msg){
  if(typeof msg === 'object') {
    msg = JSON.stringify(msg);
  }
  console.log('S--------------------Worker ' + WORKER_INDEX + ': ' + msg);
}

module.exports.setup = function (p) {
  process = p;
  WORKER_INDEX = process.env.WORKER_INDEX;
  WORKER_PORT = process.env.WORKER_PORT;
  NODE_ENV = process.env.NODE_ENV;
  log('Hi I\'m worker ' + WORKER_INDEX + ' running as a server.');
  log('Version: ' + GV.version);

  process.on('message', function (m, c) {// process server messages
    if(m.m == 'getroom'){
      log(m);
    }
  });

  wss.on('connection', function connection(ws) {
    ws.connected = true;
    ws.sendObj = function (obj) {
      try {
        ws.send(JSON.stringify(obj));
      } catch (err) {
        log('I failed to send a message.');
        log(err);
      }
    };
    ws.on('message', function incoming(data) {
      try {
        var d = JSON.parse(data);
        handleMessage(ws, d);
        log(d);
      }
      catch (err) {
        log('HACKER!!! AKA bad client message.');
        log(data);
        log(err);
      }
    });

    ws.on('close', function () {
      ws.connected = false;
    });

    ws.sendObj({m: 'hi'});
  });

  app.use(function (req, res) {// This is sent when the WebSocket is requested as a web page
    try {
      res.send('WebSocket -_- ' + WORKER_INDEX);
    } catch (err) {
      log('I failed to send a http request.');
      log(err);
    }
  });

  server.on('request', app);
  server.listen(WORKER_PORT, function () {
    log( 'I\'m listening on port ' + server.address().port)
  });

  process.send({m: 'ready'});
  process.send({m: 'getroom'});
};

