'use strict';

var http = require('http'),
  express = require('express'),
  WebSocketServer = require('ws').Server,
  server = http.createServer(),
  db = require('./MongoDB').getDb(),
  Lib = require('./Lib'),
  wss = new WebSocketServer({server: server}),
  app = express(),
  process = false,
  WORKER_PORT = false,
  WORKER_INDEX = false,
  NODE_ENV = false;

function handleMessage(ws, d) {// websocket client messages
  if (d.m === 'login') {

  }


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
  console.log('G--------------------Worker ' + WORKER_INDEX + ': ' + msg);
}

module.exports.setup = function (p) {
  process = p;
  WORKER_INDEX = process.env.WORKER_INDEX;
  WORKER_PORT = process.env.WORKER_PORT;
  NODE_ENV = process.env.NODE_ENV;
  log('Hi I\'m worker ' + WORKER_INDEX + ' running as a game room.');

  process.on('message', function (m, c) {// process server messages
    // messages from the process node
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
};



