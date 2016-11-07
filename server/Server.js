'use strict';

var http = require('http'),
  express = require('express'),
  WebSocketServer = require('ws').Server,
  server = http.createServer(),
  db = require('./MongoDB').getDb(),
  Lib = require('./Lib'),
  GV = require('./Globalvar'),
  Schema = require('./Schema'),
  wss = new WebSocketServer({server: server}),
  app = express(),
  gameRoom = {},
  Q = {},
  process = false,
  uptime = Date.now(),
  WORKER_PORT = false,
  WORKER_NAME = false,
  WORKER_TYPE = false,
  WORKER_INDEX = false,
  NODE_ENV = false;

class Queue {
  constructor(type, ProperName){
    this.starting = false;
    this.players = {};
    this.gametype = type;
    this.ProperName = ProperName;
    this.maxplayers = GV.game[this.gametype].queue.maxplayers;
    this.minplayers = GV.game[this.gametype].queue.minplayers;
    this.playersforcing = 0;
    this.resetTimer();
    process.send({m: 'getroom', type: this.gametype});
  }

  resetTimer(wait = GV.game[this.gametype].queue.maxwait){
    if (typeof this.timer !== 'undefined') clearTimeout(this.timer);
    this.timeout = Date.now() + wait;
    this.timer = setTimeout(()=>{this.startGame()}, wait);
  }

  addPlayer(ws){

    // Kick out spammers
    if(ws.lastenterqueue > Date.now() - 1000){
      ws.sendObj({m: 'popup', title: 'Not so fast!', msg: 'You just left another queue, wait a second.'});
      ws.sendObj({m: 'join', v: false});
      return false
    }
    ws.lastenterqueue = Date.now();

    // exit if player is already in another queue
    if (ws.inqueue !== false) {
      ws.sendObj({m: 'join', v: false, msg: 'You can\'t join two games at the same time.'});
      return false;
    }

    // Remove player if they are already in the queue
    this.removePlayer(ws);

    // short circuit if player is already playing
    if(ws.playing){// player is marked as currently in a game
      ws.sendObj({m: 'join', v: false, msg: 'You are already playing.'});
      return false;
    }

    // player is eligible
    this.players[ws.data.id] = ws;
    ws.inqueue = this.gametype;
    ws.forcestart = false;
    ws.waiting = true;
    ws.sendObj({m: 'join', v: true, maxplayers: this.maxplayers, minplayers: this.minplayers});
    if (this.numPlayers() === this.minplayers) this.resetTimer();
    this.updatePlayers();
    this.updateHomePage();
    if(this.numPlayers() >= this.maxplayers && this.starting === false){
      this.startGame();
    }
  }

  removePlayer(ws){
    if(typeof this.players[ws.data.id] !== 'undefined'){// player is in queue
      this.players[ws.data.id].inqueue = false;
      this.players[ws.data.id].waiting = false;
      if (this.players[ws.data.id].connected) this.players[ws.data.id].sendObj({m: 'canceljoin', v: true});
      delete this.players[ws.data.id];
      this.forceUpdate();
      this.updatePlayers();
      this.updateHomePage();
      if (this.numPlayers() === this.playersforcing){
        this.startGame();
      }
    }
  }

  forceUpdate(){
    let fstart = 0;
    let keys = Object.keys(this.players);
    keys.forEach((k)=>{
      if (this.players[k].forcestart) fstart++;
    });
    this.playersforcing = fstart;
  }

  forceStart(){
    this.forceUpdate();
    this.updatePlayers();
    if (this.numPlayers() === this.playersforcing){
      this.startGame();
    }
  }

  numPlayers(){
    let keys = Object.keys(this.players);
    return keys.length;
  }

  updatePlayers(note = ''){
    let keys = Object.keys(this.players);
    let sendObj = {m: 'joinupdate', players: keys.length, force: this.playersforcing, timeout: parseInt(this.timeout), note: note}
    let binary = Schema.pack('joinupdate', sendObj);
    keys.forEach((e,i)=>{
      this.players[e].sendBinary(binary);
    });
    // log('queueupdate', this.gametype + ' ' + keys.length + '/' + this.maxplayers + ' in queue. Timeout: ' + Lib.humanTimeDiff(Date.now(), this.timeout) + (note === '' ? '':' Note: ' + note));
  }

  updateHomePage(){
    // disable this when more players come
    let numPlayers = this.numPlayers();
    let binary = Schema.pack('q', {m: 'q', type: this.gametype, n: numPlayers});
    wss.clients.forEach((client, index)=>{
      // send to EVERYONE for now
      // if(client.inqueue === false && !client.playing) { // client on homepage
      client.sendBinary(binary);
      //}
    })
  }

  startGame(){
    // hit max players
    // or hit timeout

    // clear timer in case max players is hit before timeout
    clearTimeout(this.timer);

    // too few players?
    if(this.numPlayers() < this.minplayers){
      this.resetTimer();
      if (this.numPlayers() !== 0) this.updatePlayers();
      this.starting = false;
      return false;
    }

    // start game
    // send request

    this.starting = true;

    // maybe wait a second for a game room
    if(typeof gameRoom[this.gametype] === 'undefined' || gameRoom[this.gametype] === false || gameRoom[this.gametype] === 'full'){
      setTimeout(()=>{
        this.startGame()
      }, 30000); // Try to start again in 30 seconds
      this.resetTimer(30000);
      this.updatePlayers('full');
      return false;
    }

    // send player to gameroom
    // send gameroom to player
    // set players to playing
    let keys = Object.keys(this.players);
    let numthrough = this.maxplayers
    keys.forEach((e,i)=>{
      if (numthrough <= 0) return false;
      numthrough--;
      let uid = this.players[e].data.id;
      let name = this.players[e].data.name;
      let secret = 's' + Lib.randString(14,true,true,true);
      process.send({m: 'pass', to: gameRoom[this.gametype].id, data: {m: 'addplayer', uid: uid, secret: secret, name: name}});
      if (NODE_ENV !== 'production')
        this.players[e].sendObj({m: 'joinroom', port: gameRoom[this.gametype].port, secret: secret});
      else
        this.players[e].sendObj({m: 'joinroom', name: gameRoom[this.gametype].name, secret: secret});
      this.players[e].playing = true;
      this.players[e].inqueue = false;
      this.players[e].waiting = false;

      if (typeof this.players[e].numplays[this.gametype] === 'undefined') this.players[e].numplays[this.gametype] = 0;
      this.players[e].numplays[this.gametype]++;

      delete this.players[e];
    });

    // reset for next round
    this.starting = false;
    this.resetTimer();

    this.forceUpdate();
    this.updatePlayers();
    this.updateHomePage();

    // forget room and request another
    process.send({m: 'pass', to: gameRoom[this.gametype].id, data: {m: 'start'}});
    gameRoom[this.gametype] = false;
    process.send({m: 'getroom', type: this.gametype});
  }
}

/* Websockets */
function sendPlayerStats(ws) {
  ws.sendObj({m: 'stats', data: {id: ws.data.id, name: ws.data.name}});
  // more stats may come later
}
function sendLeaderboard(ws, game_type) {
  // make sure logged in btw
  // validate game type
  if (typeof Q[game_type] === 'undefined') return false;

  let _sort = {};
  _sort['points.' + game_type] = -1;
  db.collection('players').find({lastlogin: {$gt: Date.now() - (1000*60*60*24*365)}}, {_id: 0, name: 1, points: 1}).sort(_sort).limit(40).toArray(function(err, docs) {
    if (err) {
      log('err', 'Error with mongodb leaderboard request');
      console.log(err);
    } else if (docs.length != 0) {
      //found
      let _rebuild = [];

      docs.forEach((doc)=>{
        _rebuild.push({name: doc.name, points: typeof doc.points[game_type] === 'undefined' ? 15000 : doc.points[game_type]});
      });

      ws.sendObj({m: 'leaderboard', data: _rebuild});
    } else {
      // no leaderboards found
    }
  });
}
function sendPlayerRank(ws, game_type) {
  // make sure logged in btw
  // validate game type
  if (typeof Q[game_type] === 'undefined') return false;

  // Get the latest points
  db.collection('players').find({id: ws.uid}, {_id: 0, points: 1, totaltime: 1}).limit(1).toArray(function(err, docs) {
    if (err) {
      log('err', 'Error with mongodb sendPlayerRank');
      console.log(err);
    } else if (docs.length != 0) {
      //Reset user data
      ws.data.points = docs[0].points;
      ws.data.totaltime = docs[0].totaltime;

      // Send to player
      let _points = typeof ws.data.points[game_type] === 'undefined' ? 15000 : ws.data.points[game_type];
      let _find = {};
      _find['points.' + game_type] = {$gt: _points}
      db.collection('players').find(_find).count({}, function (err, count) {
        // +1 to account for yourself
        ws.sendObj({m: 'myrank', rank: count + 1, points: _points});
      });
    }
  });
}
function sendTimeoutPing() {
  wss.clients.forEach(function each(client) {
    if (client.timeout === true){
      log('player', 'Closing dead client.');
      client.close();
    }else{
      client.timeout = true;
      client.sendObj({m: 'timeout'});
    }
  });
  setTimeout(()=>{
    sendTimeoutPing();
  }, 1000*60*10);// 10 minutes
}
function broadcast(obj) {
  wss.clients.forEach(function each(client) {
    client.sendObj(obj);
  });
}

function handleMessage(ws, d) {// websocket client messages
  try{
    if (d.m === 'hi') {
      //ws.sendObj({m: 'hi'});
    }else if (d.m === 'timeout') {
      ws.timeout = false;
    }else if (d.m === 'version') {
      if(d.version === GV.version){
        ws.compatible = true;
        ws.sendObj({m: 'version', compatible: true});
      } else {
        ws.sendObj({m: 'version', compatible: false});
      }
    }else if (d.m === 'cookie' && ws.compatible) {
      db.collection('players').find({cookie: d.cookie}, {_id: 0, pastgames: 0, pastnames: 0, session: 0}).limit(1).toArray(function(err, docs) {
        if (err) {
          ws.sendObj({m: 'badcookie'});
          log('err', 'Error with mongodb cookie request');
          console.log(err);
        } else if (docs.length != 0) {
          //User WAS found
          ws.data = docs[0];
          ws.uid = ws.data.id;

          // Set login stuff
          sendPlayerStats(ws);
          ws.sendObj({m: 'gamelist', v: getGameList()});
          ws.sendObj({m: 'ready'});
          ws.loggedin = true;

          // Update last login
          db.collection('players').updateOne({id: ws.data.id}, {$set: {lastlogin: Date.now()}}, function(err, result){
            if(err){
              log('err', 'Mongodb update player lastlogin');
              console.log(err);
            }
          });

        } else {
          ws.sendObj({m: 'badcookie'});
        }
      });
    }else if (d.m === 'makecookie' && ws.compatible){
      var freshCookie = 'c' + Lib.randString(31,true,true,true);
      var uniqueId = 'u' + Lib.randString(15,true,true,true);
      var player = {
        cookie: freshCookie, // should be kept private, used for login
        facebook: false,
        id: uniqueId, // can be public
        name: 'Nameless',
        points: {},
        totalplays: {},
        totaltime: 0,
        lastlogin: Date.now(),
        signupdate: Date.now(),
        pastnames: [],
        session: [],
        pastgames: []
      };
      db.collection('players').insertOne(player, function(err){
        if(!err)
          ws.sendObj({m: 'makecookie', cookie: freshCookie});
      });
    }else if (d.m === 'setname' && ws.loggedin){
      if(typeof d.name !== 'string'){
        // bad name
        ws.sendObj({m: 'setname', v: false});
      }else{
        if(ws.data.name !== d.name){
          var newname = d.name.slice(0, GV.maxnamelength);

          db.collection('players').updateOne({id: ws.data.id}, {$set: {name: newname}, $push: {pastnames: newname}}, function(err, result){
            if (err) {
              log('err', 'Mongodb update player name.');
              console.log(err);
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
    }else if (d.m === 'join' && ws.loggedin) {
      if (typeof d.type === 'undefined') return false;
      if (typeof Q[d.type] === 'undefined') return false;
      Q[d.type].addPlayer(ws);
    }else if (d.m === 'forcestart' && ws.inqueue !== false) {
      ws.forcestart = !ws.forcestart;
      Q[ws.inqueue].forceStart();
      ws.sendObj({m: 'forcestate', v: ws.forcestart});
    }else if (d.m === 'getranks' && ws.loggedin) {
      if (typeof d.game === 'undefined') return false;
      ws.viewgametype = d.game;
      sendLeaderboard(ws, d.game);
      sendPlayerRank(ws, d.game);
    }else if (d.m === 'canceljoin' && ws.loggedin) {
      if (ws.inqueue !== false) Q[ws.inqueue].removePlayer(ws);
    }else if (d.m === 'gameover' && ws.loggedin){
      ws.playing = false;
    }
    // Example broadcast to all nodes
    // process.send({m: 'pass', to: 'server', data: {m: 'broadcast', message: d.message, level: d.level}});
  }catch(err){
    log('err', 'Error with handleMessage: ' + JSON.stringify(d))
    console.log(d);
    console.log(err);
  }
}

/* General */
function log(cat, msg){
  try {
    if(typeof msg === 'object') {
      msg = JSON.stringify(msg);
    }

    let x = {cat, time: Date.now(), room: WORKER_INDEX + '-' + WORKER_NAME + ' ' + WORKER_TYPE, msg: msg}
    process.send({m: 'pass', to: 'god', data: {m: 'godlog', data: x}});
  }catch(err){
    console.log(err);
  }
}
function getGameList(){
  let qKeys = Object.keys(Q);
  let games = [];
  qKeys.forEach((e,i)=>{
    let cq = Q[e];
    if (cq.gametype === GV.mainGame) // put the main game at the 0 position
      games.unshift({type: cq.gametype, name: cq.ProperName, min: cq.minplayers, cur: 0, max: cq.maxplayers});
    else
      games.push({type: cq.gametype, name: cq.ProperName, min: cq.minplayers, cur: 0, max: cq.maxplayers});
  });

  return games;
}

/* Setup */
module.exports.setup = function (p) {
  process = p;
  WORKER_INDEX = process.env.WORKER_INDEX;
  WORKER_PORT = process.env.WORKER_PORT;
  WORKER_NAME = process.env.WORKER_NAME;
  WORKER_TYPE = process.env.WORKER_TYPE;
  NODE_ENV = process.env.NODE_ENV;
  log('startnode', 'Starting [' + NODE_ENV + '] [' + GV.version + '] [' + GV.mv + ']');

  Q['game_classic'] = new Queue('game_classic', 'Classic'); // node name, Proper name
  Q['game_cities'] = new Queue('game_cities', 'Kingz & Cities');
  Q['game_exp_large_map'] = new Queue('game_exp_large_map', 'Experiment 00');

  process.on('message', function (m) {// process server messages
    if(m.m == 'getroom'){
      if (typeof m.fail === 'undefined') {
        gameRoom[m.type] = {port: m.port, id: m.id, name: m.name};
      }else{
        gameRoom[m.type] = 'full';
        setTimeout(()=>{
          process.send({m: 'getroom', type: m.type});
        }, 30000); // Request another room in 30 seconds
      }
    }else if(m.m === 'broadcast'){
      broadcast(m);
    }else if (m.m === "getstats"){
      try {
        process.send({
          m: 'pass',
          to: m.rid,
          data: {
            m: 'godmsg',
            s: m.sid,
            msg: '[' + WORKER_INDEX + '-' + WORKER_NAME + '] [' + WORKER_TYPE + ']' + ' mv:' + GV.mv + ' Uptime:' + Lib.humanTimeDiff(uptime, Date.now()) +
            ' Clients:' + wss.clients.length
          }
        });
      } catch(err) {
        log('err', 'I failed to send stats to god.');
        console.log(err);
      }
    }else if (m.m === 'rerank'){
      wss.clients.forEach(function each(client) {
        if(client.uid === m.uid) {
          sendLeaderboard(client, client.viewgametype);
          sendPlayerRank(client, client.viewgametype);
        }
      });
    }
  });

  wss.on('connection', function connection(ws) {
    ws.on('error', function(e) { log('swserr', 'Got a ws error'); console.log(e); return false; });

    log('player', 'Player connected. Total: ' + wss.clients.length);

    // don't use ws.domain or ws.extensions
    ws.connectedtime = Date.now(); // connect time
    ws.uid = 'user_id';
    ws.numplays = {};
    ws.timeout = false;
    ws.connected = true;
    ws.compatible = false;
    ws.loggedin = false;
    ws.playing = false;
    ws.waiting = false;
    ws.inqueue = false;
    ws.forcestart = false;
    ws.lastenterqueue = 0;
    ws.viewgametype = 'type_of_game';
    ws.ipaddress = ws._socket.remoteAddress;
    ws.sentBytes = 0;
    ws.recieveBytes = 0;
    ws.sendObj = function (obj) {
      if(!ws.connected) return false;

      try {
        let sending = JSON.stringify(obj)
        ws.send(sending);
        ws.sentBytes += sending.length;
      } catch (err) {
        log('wsout', 'I failed to send a message.');
      }
    };
    ws.sendBinary = function(data){
      if(!ws.connected) return false;

      try{
        ws.send(data, {binary: true});
        ws.sentBytes += data.byteLength;
      }catch(err){
        log('wsout', 'I failed to send binary a message.');
      }
    };
    ws.on('message', function incoming(data) {
      try {
        if (typeof data === 'string') {
          handleMessage(ws, JSON.parse(data))
          ws.recieveBytes += data.length;
        } else {
          var buf = new Buffer(data, 'binary')
          handleMessage(ws, Schema.unpack(buf))
          ws.recieveBytes += data.byteLength;
        }
      }
      catch (err) {
        log('err', 'HACKER!!! AKA bad client message. ' + JSON.stringify(data));
        console.log(data);
        console.log(err);
      }
    });

    ws.on('close', function () {
      try {
        ws.connected = false;
        log('player', 'Player disconnected. Total: ' + wss.clients.length + ' Bytes: ' + ws.sentBytes + '|' + ws.recieveBytes + ' Stayed: ' + Lib.humanTimeDiff(ws.connectedtime, Date.now()));
        if (ws.inqueue !== false) Q[ws.inqueue].removePlayer(ws);

        if (!ws.loggedin) return false;
        db.collection('players').updateOne({id: ws.data.id},
          {$inc: {totaltime: Date.now() - ws.connectedtime}, $push: {session: {enter: ws.connectedtime, ip: ws.ipaddress, plays: ws.numplays, up: ws.recieveBytes, down: ws.sentBytes, exit: Date.now()}}}, function(err, result){
            if (err) {
              log('err', 'Mongodb update session.');
              console.log(err);
            }
          });
      }catch(err){
        log('err', 'Error with ws.on close.')
        console.log(err);
      }

    });

    ws.sendObj({m: 'hi'});
  });

  app.use(function (req, res) {// This is sent when the WebSocket is requested as a web page
    try {
      res.send('WebSocket -_- ' + WORKER_INDEX);
    } catch (err) {
      log('err', 'I failed to send a http request.');
      console.log(err);
    }
  });

  server.on('request', app);
  server.listen(WORKER_PORT, function () {
    // log('startnode', 'I\'m listening on port ' + server.address().port)
  });

  process.send({m: 'ready'});
  sendTimeoutPing();
};

