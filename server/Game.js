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

class Game {
  static setup(){
    // set or reset game room
    // start will be called when all player spots are accounted for
    this.gameid = 'g' + Lib.md5(Math.random() + Date.now()) + 'game';
    this.allowplayers = {};
    this.players = [];
    this.map = {};
    this.map.solid = [];
    this.map.units = [];
    this.map.owner = [];

    this.running = false;
    this.loopdelay = GV.game.loopdelay;
  }

  static start(){
    // at this point all player spots are accounted for
    // players may not have joined yet, but we know how many

    // build map
    // width and height of map in user blocks
    this.mapusersize = Math.ceil(Math.sqrt(this.players.length));
    // width and height guaranteed to each user in cell blocks
    this.mapcellsize = Math.floor(Math.sqrt(GV.game.areaperplayer));
    // total width and height in cells
    this.maptotalsize = this.mapusersize * this.mapcellsize;
    // build map
    for(let y=0; y<this.maptotalsize; y++){
      this.map.solid[y] = [];
      this.map.units[y] = [];
      this.map.owner[y] = [];
      for(let x=0; x<this.maptotalsize; x++){
        this.map.solid[y][x] = Math.round(Math.random());
        this.map.units[y][x] = 0;
        this.map.owner[y][x] = -1;
      }
    }
    // rearrange solid blocks
    this.mapGOL();

    // place players in map
    let pindex = 0;
    for(let y=0; y<this.mapusersize; y++){
      for(let x=0; x<this.mapusersize; x++){
        var randcellx = Math.floor(Math.random() * this.mapcellsize);
        var randcelly = Math.floor(Math.random() * this.mapcellsize);

        var offsetx = x * this.mapcellsize;
        var offsety = y * this.mapcellsize;

        var totx = offsetx + randcellx;
        var toty = offsety + randcelly;

        if(typeof this.players[pindex] !== 'undefined'){
          this.map.solid[toty][totx] = 0;
          this.map.units[toty][totx] = 2;
          this.map.owner[toty][totx] = pindex;
          this.players[pindex].kingloc = {x: toty,y: totx};
        }
        pindex++;
      }
    }

    // start loop
    this.running = true;
    this.loop();
  }

  static mapGOL(){// game of life to rearrange the solid blocks

    let maxnumsolid = (this.maptotalsize * this.maptotalsize / 4);

    let numsolid = 0;
    for(let c=0; c<this.maptotalsize; c++){
      for(let d=0; d<this.maptotalsize; d++) {
        if (this.map.solid[c][d] == 1) numsolid++;
      }
    }

    for(let y=0; y<this.maptotalsize; y++){
      for(let x=0; x<this.maptotalsize; x++){
        let n = 0;

        // count neighbors
        for(let a=-1; a<=1; a++){
          for(let b=-1; b<=1; b++){
            if(a == 0 && b == 0) continue;// current block
            if(typeof this.map.solid[y+a] === 'undefined') continue;
            if(typeof this.map.solid[y+a][x+b] === 'undefined') continue;
            if(this.map.solid[y+a][x+b] == 1) n++;
          }
        }

        // live and die
        if(n < 1){// die
          if(this.map.solid[y][x] == 1) numsolid--;
          this.map.solid[y][x] = 0;
        }else if(n > 2){// die
          if(this.map.solid[y][x] == 1) numsolid--;
          this.map.solid[y][x] = 0;
        }else if(n === 2 && numsolid < maxnumsolid){// live
          if(this.map.solid[y][x] == 0) numsolid++;
          this.map.solid[y][x] = 1;
        }

      }
    }

    if(numsolid != maxnumsolid){
      this.mapGOL();
    }
  }

  static loop(){
    setTimeout(()=> {
      setTimeout(()=> {
        if(this.running)
          this.loop()
      }, 1);
    }, this.loopdelay);

  }

  static endgame(){
    // save stats to database

    // kick all players
    this.players.forEach((e,i)=>{
      e.ws.close();
    });
    // reset the server
    this.setup();
    // mark as open
    process.send({m: 'open'});
  }

}
Game.setup();

/* Websockets */
function broadcast(obj) {
  wss.clients.forEach(function each(client) {
    client.sendObj(obj);
  });
}

function handleMessage(ws, d) {// websocket client messages
  try{
    // << hi
    // >> hi
    if (d.m === 'hi') {
      //ws.sendObj({m: 'hi'});
    }
    // << (m: 'joinroom, userid, secret)
    /* link user ws to that player id */
    if (d.m === 'joinroom'){
      if(Game.allowplayers[d.uid] !== 'undefined' && Game.allowplayers[d.uid].secret === d.secret){
        let pid = Game.allowplayers[d.uid].pid;
        Game.players[pid].ws = ws;
        Game.players[pid].connected = true;
        ws.pid = pid;
        ws.uid = d.uid;
        ws.secret = d.secret;
        ws.lastchat = Date.now();
      }
    }




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
    if (d.m === 'chat'){
      if(ws.lastchat < Date.now() - 5000){// longer than 5 seconds ago
        var msg = d.message.slice(0,144);
        broadcast({m: 'chat', from: ws.pid, message: msg});
      }else{
        ws.sendObj({m: 'chat', from: 'game', message: 'You can only send 1 message every 5 seconds.'})
      }
    }


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
  }catch(err){
    log(err);
  }
}

/* General */
function log(msg){
  if(typeof msg === 'object') {
    msg = JSON.stringify(msg);
  }
  console.log('G--------------------Worker ' + WORKER_INDEX + ': ' + msg);
}

/* Setup */
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
    if(m.m === 'addplayer'){
      /* add player spots and start the game loop */
      /* players will start joining and claiming their spot */
      let pid = Game.players.length;
      Game.players[pid] = {connected: false, pid: pid, name: m.name};
      Game.allowplayers[m.uid] = {secret: m.secret, pid: pid};
    }
    if(m.m === 'start'){
      Game.start();
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



