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


function broadcast(obj) {
  wss.clients.forEach(function each(client) {
    client.sendObj(obj);
  });
};

function handleMessage(ws, d) {// websocket client messages
  if (d.m === 'login') {

  }

  /* Message from master from server*/
  // << get ready
  /* server reset */
  // >> ready
  /* set game id */

  /* wait for all players to join queue */

  // << list of users (username, user id, gameroom id)
  /* pull name and rank from mongodb */
  /* add players and start the game loop */
  // >> game is running
  /* players will start joining and claiming their spot */

  /* messages from usersr */
  // << hi
  // >> hi
  // << my cookie id, and game room user id
  /* link user ws to that player id */

  /* client game setup*/
  // >> list of players {name, color, game id}
  // >> map
  // >> player locations and unit numbers
  // >> king position


  /* game running messages */
  // >> update block numbers
  // >> update block colors
  // >> update king positions

  // << move/attack units {x,y,percent,direction}
  /* client waits until move is made */
  /* calculate attack and move separately */
  // >> move done
  /* maybe allow player to queue up a few moves */
  /* allow player to make another move */

  // << chat message
  /* sanatize */
  /* block spam */
  // >> broadcast to room


  // >> you've been taken over by "player" / you win
  // >> you came in rank x out of y
  // >> you lasted 1 minute 12 seconds
  // >> list of players rank and alive status and playtime
  /* player can still watch game but can't make moves*/
  /* add game stats to mongodb {{game id, num players, finish place, killer, playtime}, win ratio, rank, points} {points from looser to killer} */
  // << exit game/ close connection
  /* user is sent back to the home screen*/

  /* last player alive triggers a 15 second timeout to kick everyone from server*/
  /* server resets */




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
  log('Version: ' + GV.version);

  process.on('message', function (m, c) {// process server messages
    // messages from the process node
    if(m.m === 'broadcast'){
      broadcast(m);
    }
    log(m);
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



