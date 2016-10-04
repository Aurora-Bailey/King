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
    log('Setup game ' + this.gameid);
    this.pointpool = 0;
    this.allowplayers = {};
    this.players = [];
    this.playerarray = [];// a version of players that can be sent over the network
    this.map = {};
    this.map.solid = [];
    this.map.units = [];
    this.map.owner = [];

    this.golCalls = 0;
    this.running = false;
    this.loopdelay = GV.game.loopdelay;
    this.loopcount = 0;
  }

  static start(){
    // at this point all player spots are accounted for
    // players may not have joined yet, but we know how many
    this.starttime = Date.now();
    this.playersalive = this.players.length;

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

    // maybe randomize the order for fairness
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
          this.players[pindex].kingloc = {x: totx,y: toty};
          this.playerarray[pindex].kingloc = this.players[pindex].kingloc;
        }
        pindex++;
      }
    }

    // re color players to be a bit more distinct
    // leave previous value as place holder (random color)
    this.players.forEach((e,i)=>{
      this.players[i].color = (360/this.players.length) * i;
      this.playerarray[i].color = this.players[i].color;
    });


    // start loop
    this.running = true;
    this.loop();
  }

  static mapGOL(){// game of life to rearrange the solid blocks
    this.golCalls++;

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

    if(numsolid != Math.ceil(maxnumsolid) && this.golCalls < 10){
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

    // add units
    if(this.loopcount % 10 == 0){// once every 10 loops
      for(let y=0; y<this.maptotalsize; y++){
        for(let x=0; x<this.maptotalsize; x++){
          if(this.map.owner[y][x] != -1){
            this.map.units[y][x]++;
          }
        }
      }
    }

    // maybe randomize the order for fairness
    // process user moves {x,y,percent,direction}
    this.players.forEach((e,i)=>{
      if(e.makemove.length > 0){
        let ws = e.ws;
        let move = e.makemove.shift();
        if(isNaN(move[0]) || isNaN(move[1]) || isNaN(move[2]) || isNaN(move[3])) return false;

        let x = move[0];
        let y = move[1];
        let percent = move[2];
        let direction= move[3];// up right down left

        if(typeof Game.map.solid[y] === 'undefined') return false;
        if(typeof Game.map.solid[y][x] === 'undefined') return false;
        if(Game.map.owner[y][x] !== ws.pid) return false;
        if(Game.map.units[y][x] < 2) return false;
        if(percent > 100 || percent < 0) return false;
        if(direction > 3 || direction < 0) return false;

        let moveto = {x: x, y: y};
        if(direction == 0) moveto.y--;
        if(direction == 1) moveto.x++;
        if(direction == 2) moveto.y++;
        if(direction == 3) moveto.x--;
        if(typeof Game.map.solid[moveto.y] === 'undefined') return false;
        if(typeof Game.map.solid[moveto.y][moveto.x] === 'undefined') return false;
        if(Game.map.solid[moveto.y][moveto.x] === 1) return false;// solid

        let amount = Math.round(Game.map.units[y][x] * (percent/100));
        if(amount == Game.map.units[y][x]) amount--;// can't move all units
        if(amount == 0) amount++;// can't move no units

        if(Game.map.owner[moveto.y][moveto.x] === ws.pid){
          // my cell
          Game.map.units[moveto.y][moveto.x] += amount;
          Game.map.units[y][x] -= amount;

        }else if(Game.map.owner[moveto.y][moveto.x] === -1){
          // empty cell
          Game.map.owner[moveto.y][moveto.x] = ws.pid;
          Game.map.units[moveto.y][moveto.x] += amount;
          Game.map.units[y][x] -= amount;

        }else{
          // enemy cell
          let enemyid = Game.map.owner[moveto.y][moveto.x];
          let enemyattack = Game.map.units[moveto.y][moveto.x];
          let myattack = amount;
          let myunintsleft = myattack - enemyattack;

          if(myunintsleft > 0){
            // take over cell
            Game.map.owner[moveto.y][moveto.x] = ws.pid;
            Game.map.units[moveto.y][moveto.x] = myunintsleft;
            Game.map.units[y][x] -= amount;

            // take over player
            if(this.players[enemyid].kingloc.x == moveto.x && this.players[enemyid].kingloc.y == moveto.y){
              this.playerDead(enemyid, e.name);
              this.players[ws.pid].kills++;

              // claim your new kingdom
              for(let ey=0; ey<this.maptotalsize; ey++){
                for(let ex=0; ex<this.maptotalsize; ex++){
                  if(this.map.owner[ey][ex] == enemyid){
                    this.map.owner[ey][ex] = ws.pid;
                    this.map.units[ey][ex] = Math.ceil(this.map.units[ey][ex] * 0.5);// you only get half the kingdom
                  }
                }
              }

              // you are the only one alive
              if(this.playersalive == 1){
                broadcast({m: 'chat', from: 'Server', message: this.players[ws.pid].name + ' is the winner!!!!'});
                broadcast({m: 'chat', from: 'Server', message: 'Server will close in 2 minutes.'});
                setTimeout(()=>{this.playerDead(ws.pid, 'Server');}, 2000);// kill the winner
                setTimeout(()=>{this.endgame();}, 120000);
              }
            }
          }else{
            Game.map.units[moveto.y][moveto.x] -= amount;
            Game.map.units[y][x] -= amount;
          }
        }
      }
    });

    /* game running messages */
    // >> update block numbers
    // >> update block colors
    // >> update king positions?
    // send changes to players
    this.players.forEach((e,i)=>{
      if(!e.connected) return false;
      e.ws.sendObj({m: 'map', type: 'units', data: Game.map.units});
      e.ws.sendObj({m: 'map', type: 'owner', data: Game.map.owner});
    });

    this.loopcount++;
  }

  static playerDead(pid, killername){
    //websocket of dead person
    let ws = this.players[pid].ws;

    broadcast({m: 'playerdead', pid: pid, timealive: Date.now() - this.starttime, place: this.playersalive, kills: this.players[pid].kills, killer: killername});


    // database
    db.collection('players').updateOne({id: ws.uid}, {$push: {pastgames: {
      gameid: this.gameid,
      name: this.players[pid].name,
      color: this.players[pid].color,
      place: this.playersalive,
      numplayers: this.players.length,
      kills: this.players[pid].kills,
      killer: killername,
      timealive: Date.now() - this.starttime
    }}}, function(err, result){
      if(err)
        log(err);
    });
    db.collection('players').updateOne({id: ws.uid}, {$inc: {numplays: 1}}, function(err, result){
      if(err)
        log(err);
    });
    let points = 0;
    if(this.playersalive == 3) points = Math.round(this.pointpool/4);
    if(this.playersalive == 2) points = Math.round(this.pointpool/4);
    if(this.playersalive == 1) points = Math.round(this.pointpool/2);
    if(points !== 0){
      db.collection('players').updateOne({id: ws.uid}, {$inc: {points: points}}, function(err, result){
        if(err)
          log(err);
      });
    }



    this.playersalive--;
    this.players[pid].dead = true;
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

/* Websockets */
function broadcast(obj) {
  wss.clients.forEach(function each(client) {
    client.sendObj(obj);
  });
}

function handleMessage(ws, d) {// websocket client messages

  // delay message if game is not running
  if(!Game.running){
    setTimeout(()=>{handleMessage(ws,d)}, 1000);
    return false;
  }

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
        ws.playing = true;
        ws.pid = pid;
        ws.uid = d.uid;
        ws.secret = d.secret;
        ws.lastchat = Date.now();

        ws.sendObj({m: 'welcome', pid: pid});
        ws.sendObj({m: 'map', type: 'solid', data: Game.map.solid});
        ws.sendObj({m: 'players', data: Game.playerarray});// id name color king location

        // take one point for the point pool
        db.collection('players').updateOne({id: ws.uid}, {$inc: {points: -1}}, function(err, result){
          if(err)
            log(err);
          else
            Game.pointpool++;
        });
      }
    }


    // << move/attack units {x,y,percent,direction}
    /* client waits until move is made */
    /* calculate attack and move separately */
    // >> move done
    /* maybe allow player to queue up a few moves */
    /* allow player to make another move */
    if (d.m === 'move' && ws.playing) {
      if(Game.players[ws.pid].makemove.length > GV.game.maxmovequeue) return false;
      Game.players[ws.pid].makemove.push(d.move);
    }

    // << chat message
    /* sanatize */
    /* block spam */
    // >> broadcast to room
    if (d.m === 'chat' && ws.playing){
      if(ws.lastchat < Date.now() - 1000){// longer than 1 second ago
        var msg = d.message.slice(0,144);
        ws.lastchat = Date.now();
        broadcast({m: 'chat', from: ws.pid, message: msg});
      }else{
        ws.sendObj({m: 'chat', from: 'Server', message: 'Limit 1 message per second.'})
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
      Game.players[pid] = {connected: false, pid: pid, name: m.name, color: Math.floor(Math.random() * 360), makemove: [], kills: 0};// server version
      Game.playerarray[pid] = {pid: pid, name: m.name, color: Game.players[pid].color};// version that will be sent to player
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

  // setup game
  Game.setup();

  process.send({m: 'ready'});
};



