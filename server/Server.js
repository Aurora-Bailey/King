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

class Queue {
  static reset(){
    this.timeout = Date.now() + GV.queue.maxwait;
    this.timer = setTimeout(()=>{this.startGame()}, GV.queue.maxwait);
    this.players = {};
  }

  static addPlayer(ws){
    // short circuit if player is already in queue or already playing
    if(typeof this.players[ws.data.id] !== 'undefined'){// player is already in queue
      ws.sendObj({m: 'join', v: false, msg: 'You are already waiting in the queue.'});
      return false;
    }else if(ws.playing){// player is marked as currently in a game
      ws.sendObj({m: 'join', v: false, msg: 'You are already playing.'});
      return false;
    }

    // player is eligible
    this.players[ws.data.id] = ws;
    ws.sendObj({m: 'join', v: true, timeout: this.timeout, maxplayers: GV.queue.maxplayers});
    this.updatePlayers();
  }

  static updatePlayers(){
    let keys = Object.keys(this.players);
    keys.forEach((e,i)=>{
      this.players[e].sendObj({m: 'joinupdate', players: keys.length, timeout: this.timeout})
    });
  }

  static startGame(){
    clearTimeout(this.timer);
    let keys = Object.keys(this.players);
    if(keys.length < GV.queue.minplayers){
      // too few players
      this.timeout = Date.now() + GV.queue.maxwait;// set the timer back
      this.timer = setTimeout(()=>{this.startGame()}, GV.queue.maxwait);
      this.updatePlayers();
      return false;
    }

    // start game
    // send request

    // set players to playing
    keys.forEach((e,i)=>{
      this.players[e].playing = true;
    });

    // reset for next round
    this.reset();
  }
}
Queue.reset();

/* Websockets */
function sendPlayerStats(ws) {
  var copy = Lib.deepCopy(ws.data);
  delete copy._id;
  delete copy.cookie;
  delete copy.pastgames;
  ws.sendObj({m: 'stats', data: copy});
}
function broadcast(obj) {
  wss.clients.forEach(function each(client) {
    client.sendObj(obj);
  });
};

function handleMessage(ws, d) {// websocket client messages
  try{
    // << hi
    // >> hi
    if (d.m === 'hi') {
      ws.sendObj({m: 'hi'});
    }

    // << version compatible GV.version
    // >> true/false
    if (d.m === 'version') {
      if(d.version === GV.version){
        ws.compatible = true;
        ws.sendObj({m: 'version', compatible: true});
      } else {
        ws.sendObj({m: 'version', compatible: false});
      }
    }

    // << unique cookie id/ lack of cookie
    /* if no cookie, make one and store it in mondodb, then send it to the user*/
    // >> user stats
    /*logged in*/
    if (d.m === 'cookie' ){ // && ws.compatible) {
      db.collection('players').find({cookie: d.cookie}).limit(1).toArray(function(err, docs) {
        if (err) {
          ws.sendObj({m: 'badcookie'});
          log('Error with mongodb cookie request');
          log(err);
        } else if (docs.length != 0) {
          //User WAS found
          ws.data = docs[0];

          // Set login stuff
          sendPlayerStats(ws);
          ws.sendObj({m: 'ready'});
          ws.loggedin = true;

          // Update last login
          db.collection('players').updateOne({id: ws.data.id}, {$set: {lastlogin: Date.now()}}, function(err, result){
            if(err)
              log(err);
          });

        } else {
          ws.sendObj({m: 'badcookie'});
        }
      });
    }
    if (d.m === 'makecookie' ){ // && ws.compatible){
      var freshCookie = 'c' + Lib.md5(Math.random() + Date.now()) + 'cookie';
      var uniqueId = 'u' + Lib.md5(Math.random() + Date.now()) + 'user';
      var player = {
        cookie: freshCookie, // should be kept private, used for login
        id: uniqueId, // can be public
        name: 'Nameless',
        avgplace: 0,
        rank: 0,
        points: 1000,
        numplays: 0,
        lastlogin: Date.now(),
        pastgames: []
      };
      db.collection('players').insertOne(player, function(err){
        if(!err)
          ws.sendObj({m: 'makecookie', cookie: freshCookie});
      });
    }

    // << set/update name
    // >> player stats
    // >> set name true/false
    if (d.m === 'setname' && ws.loggedin){
      if(typeof d.name !== 'string'){
        // bad name
        ws.sendObj({m: 'setname', v: false});
      }else{
        if(ws.data.name !== d.name){
          var newname = d.name.slice(0, GV.maxnamelength);

          db.collection('players').updateOne({id: ws.data.id}, {$set: {name: newname}}, function(err, result){
            if (err) {
              log(err);
            } else {
              ws.data.name = newname;
              sendPlayerStats(ws);
              ws.sendObj({m: 'setname', v: true});
            }
          });
        } else {
          // name is the same
          ws.sendObj({m: 'setname', v: false});
        }
      }
    }

    // << join game request
    /* add user to waiting queue, ignore if already in queue or playing*/
    // >> give update on num players and timeout
    /* when all spots are filled or timeout is hit */
    /* send master list of unique ids and user ids, master sends game room list of unique ids*/
    /* game room will return with 'running' when ready */
    // >> ip address with port, unique id string specific to game room
    /* set user to playing */
    if (d.m === 'join' && ws.loggedin) {
      Queue.addPlayer(ws);
    }

    // << game over
    // >> send new stats
    /* set user to not playing*/
    if (d.m === 'gameover' && ws.loggedin){
      ws.playing = false;
      sendPlayerStats(ws);
    }

    /* admin commands*/
    // << {m: 'broadcast', pass: 'l3rd9uwb', message: 'server will restart in 10 minutes', level: 'warn'}
    /* send to master, master sends to server nodes, server broadcasts */
    // >> broadcast message to all users, display as banner
    //{"m": "broadcast", "password": "l3rd9uwb", "message": "", "level": "warn"}
    if (d.m === 'broadcast' && d.password === 'l3rd9uwb'){
      // *notice. sent to process not websocket
      process.send({m: 'pass', to: 'server', data: {m: 'broadcast', message: d.message, level: d.level}});
    }

  }catch(err){
    log(err);
  }
}

/* General */
function log(msg){
  if(typeof msg === 'object') {
    msg = JSON.stringify(msg);
  }
  console.log('S--------------------Worker ' + WORKER_INDEX + ': ' + msg);
}

/* Setup */
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
    if(m.m === 'broadcast'){
      broadcast(m);
    }
    log(m);
  });

  wss.on('connection', function connection(ws) {
    ws.connected = true;
    ws.compatible = false;
    ws.loggedin = false;
    ws.playing = false;
    ws.sendObj = function (obj) {
      if(!ws.connected) return false;

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

