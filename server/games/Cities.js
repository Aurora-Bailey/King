'use strict';

/*
 Note: to add new game mode, clone this file into server/games
 1) Make up a unique worker name ex: 'game_classic'
 2) king.js - require file and run if WORKER_TYPE == 'game_classic'
 3) Server.js - add Queue object under WORKER_TYPE Q['game_classic'] = new Queue('game_classic', 'Propper Name');
 4) Home.vue - add button with v-on:click="join('game_classic')"
 */

/*
  Numbers and meanings

  map.owner:
  -3 == 'fog'
  -2 == 'solid'
  -1 == 'empty'
  0+ == player id

  map.token:
  1 == 'king'
  2 == 'fallen king

  map.units:
  0+ == number of units

*/

var http = require('http'),
  express = require('express'),
  WebSocketServer = require('ws').Server,
  server = http.createServer(),
  db = require('../MongoDB').getDb(),
  Lib = require('../Lib'),
  GV = require('../Globalvar'),
  Schema = require('../Schema'),
  Rank = require('../Rank'),
  wss = new WebSocketServer({server: server}),
  app = express(),
  process = false,
  uptime = Date.now(),
  WORKER_PORT = false,
  WORKER_INDEX = false,
  WORKER_NAME = false,
  WORKER_TYPE = false,
  NODE_ENV = false;

var now = require("performance-now");

class Game {
  static setup(){
    // set or reset game room
    // start will be called when all player spots are accounted for
    //this.gameid = 'g' + Lib.md5(Math.random() + Date.now()) + WORKER_TYPE;
    this.gameid = 'g' + Lib.randString(15,true,true,true);
    // log('setup', 'Setup ' + WORKER_TYPE + ' ' + this.gameid);
    this.allowplayers = {};
    this.players = [];
    this.playerarray = [];// a version of players that can be sent over the network
    this.map = {};
    this.map.units = [];
    this.map.owner = [];
    this.map.token = [];
    this.oldmap = Lib.deepCopy(this.map);

    this.golCalls = 0;
    this.running = false;
    this.loopdelay = GV.game[WORKER_TYPE].loopdelay;
    this.loopcount = 0;

    this.chatlogs = [];
    this.chatlogsdata = [];
    this.deadlogs = [];
  }

  static start(){
    // at this point all player spots are accounted for
    // players may not have joined yet, but we know how many
    this.starttime = Date.now();
    this.playersalive = this.players.length;

    // keep track of players
    log('gamestart', 'Starting with ' + this.playersalive + ' players. Game:' + this.gameid);

    // close game after a long time in case of a dissconnected room or something
    this.forceclose = setTimeout(()=>{this.endgame();}, 1000*60*60*6)// 6 hours

    // build map
    // width and height of map in user blocks
    this.mapusersize = Math.ceil(Math.sqrt(this.players.length));
    // width and height guaranteed to each user in cell blocks
    this.mapcellsize = Math.floor(Math.sqrt(GV.game[WORKER_TYPE].areaperplayer));
    // total width and height in cells
    this.maptotalsize = this.mapusersize * this.mapcellsize;
    // build map
    for(let y=0; y<this.maptotalsize; y++){
      this.map.units[y] = [];
      this.map.owner[y] = [];
      this.map.token[y] = [];
      for(let x=0; x<this.maptotalsize; x++){
        this.map.units[y][x] = 0;
        this.map.owner[y][x] = -1 - Math.round(Math.random());
        this.map.token[y][x] = 0;
      }
    }
    // rearrange solid blocks
    this.mapGOL();

    // maybe randomize the order for fairness
    // place players in map
    let pindexarr = []
    this.players.forEach((e,i)=>{pindexarr.push(i);});
    while (pindexarr.length < this.mapusersize * this.mapusersize) {pindexarr.push('empty');}
    for(let y=0; y<this.mapusersize; y++){
      for(let x=0; x<this.mapusersize; x++){

        let randcellx = Math.floor(Math.random() * this.mapcellsize);
        let randcelly = Math.floor(Math.random() * this.mapcellsize);

        let offsetx = x * this.mapcellsize;
        let offsety = y * this.mapcellsize;

        let totx = offsetx + randcellx;
        let toty = offsety + randcelly;

        let numempty = this.getMapNumEmpty(totx, toty);

        while(numempty < this.maptotalsize * this.maptotalsize / 4 || numempty === "solid") {
          randcellx = Math.floor(Math.random() * this.mapcellsize);
          randcelly = Math.floor(Math.random() * this.mapcellsize);

          offsetx = x * this.mapcellsize;
          offsety = y * this.mapcellsize;

          totx = offsetx + randcellx;
          toty = offsety + randcelly;

          numempty = this.getMapNumEmpty(totx, toty);
        }


        if (pindexarr.length === 0) continue;
        let randarr = Math.floor(Math.random() * pindexarr.length);
        let pindex = pindexarr[randarr];
        pindexarr.splice(randarr, 1);
        if (pindex === 'empty') continue;

        if(typeof this.players[pindex] !== 'undefined'){
          this.map.units[toty][totx] = 2;
          this.map.owner[toty][totx] = pindex;
          this.map.token[toty][totx] = 1; // king
        }
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

  static getMapNumEmpty(cellx, celly) {
    let ret = this.mapNumEmpty(cellx, celly);

    // clean up
    for(let y=0; y<this.maptotalsize; y++){
      for(let x=0; x<this.maptotalsize; x++){
        if (this.map.owner[y][x] == -100) this.map.owner[y][x] = -1;
      }
    }

    return ret;
  }

  static mapNumEmpty(cellx, celly){
    if (typeof this.map.owner[celly] === 'undefined') return 'edge';
    if (typeof this.map.owner[celly][cellx] === 'undefined') return 'edge';

    if (this.map.owner[celly][cellx] == -2) return 'solid';

    if (this.map.owner[celly][cellx] == -1) {
      let emptyneig = 1;

      this.map.owner[celly][cellx] = -100;

      let r = this.mapNumEmpty(cellx+1, celly);
      if (!isNaN(r)) emptyneig += r;

      let l = this.mapNumEmpty(cellx-1, celly);
      if (!isNaN(l)) emptyneig += l;

      let u = this.mapNumEmpty(cellx, celly-1);
      if (!isNaN(u)) emptyneig += u;

      let d = this.mapNumEmpty(cellx, celly+1);
      if (!isNaN(d)) emptyneig += d;

      return emptyneig;
    }

    return 'processed';
  }

  static mapGOL(){// game of life to rearrange the solid blocks
    this.golCalls++;

    let maxnumsolid = (this.maptotalsize * this.maptotalsize / 4);

    let numsolid = 0;
    for(let c=0; c<this.maptotalsize; c++){
      for(let d=0; d<this.maptotalsize; d++) {
        if (this.map.owner[c][d] == -2) numsolid++;
      }
    }

    for(let y=0; y<this.maptotalsize; y++){
      for(let x=0; x<this.maptotalsize; x++){
        let n = 0;

        // count neighbors
        for(let a=-1; a<=1; a++){
          for(let b=-1; b<=1; b++){
            if(a == 0 && b == 0) continue;// current block
            if(typeof this.map.owner[y+a] === 'undefined') continue;
            if(typeof this.map.owner[y+a][x+b] === 'undefined') continue;
            if(this.map.owner[y+a][x+b] == -2) n++;
          }
        }

        // live and die
        if(n < 1){// die
          if(this.map.owner[y][x] == -2) numsolid--;
          this.map.owner[y][x] = -1;
        }else if(n > 2){// die
          if(this.map.owner[y][x] == -2) numsolid--;
          this.map.owner[y][x] = -1;
        }else if(n === 2 && numsolid < maxnumsolid){// live
          if(this.map.owner[y][x] == -1) numsolid++;
          this.map.owner[y][x] = -2;
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

    // Make a copy of map before we change anything
    this.oldmap = Lib.deepCopy(this.map);

    // add units
    for(let y=0; y<this.maptotalsize; y++){
      for(let x=0; x<this.maptotalsize; x++){
        if(this.map.owner[y][x] >= 0 && this.map.token[y][x] === 1){
          this.map.units[y][x]++;
        }
      }
    }

    // maybe randomize the order for fairness
    // process user moves {x,y,percent,direction}
    this.players.forEach((e,i)=>{
      try {
        // try to make a move
        if(e.makemove.length > 0){
          let move = e.makemove.shift();
          if(isNaN(move[0]) || isNaN(move[1]) || isNaN(move[2]) || isNaN(move[3]) || isNaN(move[4])) return false;

          let [x, y, percent, tox, toy, delay] = move; // delay (#6) is added dynamically, ws move only allows for 5 values.

          if(typeof Game.map.owner[y] === 'undefined') return false;
          if(typeof Game.map.owner[y][x] === 'undefined') return false;

          // Delay a move
          if (Game.map.owner[y][x] === e.pid) {
            // trying to move king
            if (Game.map.token[y][x] === 1) {

              // set delay
              if (typeof delay === 'undefined') {
                // this counts for +1 delay.
                // no delay = mak move on first tick
                // 0 = make move on second tick
                e.makemove.unshift([x, y, percent, tox, toy, 0]);// push move back into queue
                return false; // exit move logic
              } else if (delay <= 0) {
                // let the move past
              } else {
                e.makemove.unshift([x, y, percent, tox, toy, delay - 1]);// push move back into queue
                return false; // exit move logic
              }
            }
          }

          e.ws.sendBinary(Schema.pack('movedone', {m: 'movedone', x: x, y: y}));

          // convert back to direction for old classic system
          let direction = false;// up right down left
          if (y - 1 === toy && x === tox) direction = 0;
          if (y + 1 === toy && x === tox) direction = 2;
          if (y === toy && x + 1 === tox) direction = 1;
          if (y === toy && x - 1 === tox) direction = 3;
          if (direction === false) return false;

          // validate move
          if(Game.map.owner[y][x] !== e.pid) return false;
          if(Game.map.units[y][x] < 1) return false;
          if(percent > 100 || percent < 0) return false;
          if(direction > 3 || direction < 0) return false;

          let moveto = {x: x, y: y};
          if(direction == 0) moveto.y--;
          if(direction == 1) moveto.x++;
          if(direction == 2) moveto.y++;
          if(direction == 3) moveto.x--;
          if(typeof Game.map.owner[moveto.y] === 'undefined') return false;
          if(typeof Game.map.owner[moveto.y][moveto.x] === 'undefined') return false;
          if(Game.map.owner[moveto.y][moveto.x] === -2) return false;// solid

          let amount = Math.round(Game.map.units[y][x] * (percent/100));

          // Compute move
          if(Game.map.owner[moveto.y][moveto.x] === e.pid){
            // my cell
            Game.map.units[moveto.y][moveto.x] += amount;
            Game.map.units[y][x] -= amount;

          }else if(Game.map.owner[moveto.y][moveto.x] === -1){
            // empty cell
            Game.map.owner[moveto.y][moveto.x] = e.pid;
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
              Game.map.owner[moveto.y][moveto.x] = e.pid;
              Game.map.units[moveto.y][moveto.x] = myunintsleft;
              Game.map.units[y][x] -= amount;

              // take over player
              if(Game.map.token[moveto.y][moveto.x] === 1){
                Game.map.token[moveto.y][moveto.x] = 2;
                this.playerDead(enemyid, e.name, e.pid);
                this.players[e.pid].kills++;

                // claim your new kingdom
                for(let ey=0; ey<this.maptotalsize; ey++){
                  for(let ex=0; ex<this.maptotalsize; ex++){
                    if(this.map.owner[ey][ex] == enemyid){
                      this.map.owner[ey][ex] = e.pid;
                      this.map.units[ey][ex] = Math.ceil(this.map.units[ey][ex] * 0.5);// you only get half the kingdom
                    }
                  }
                }

                // you are the only one alive
                if(this.playersalive == 1){
                  broadcastChat('Game', this.players[e.pid].name + ' is the winner!!!!');
                  broadcastChat('Server', 'Server will close in 2 minutes.')
                  setTimeout(()=>{this.playerDead(e.pid, 'Server', -1);}, 100);// kill the winner
                  clearTimeout(this.forceclose);
                  this.forceclose = setTimeout(()=>{this.endgame();}, 120000);
                }
              }
            }else{
              // you attacked but didn't have enough units
              Game.map.units[moveto.y][moveto.x] -= amount;
              Game.map.units[y][x] -= amount;
            }
          }

          // Move token
          if(Game.map.units[y][x] === 0){
            if (Game.map.token[moveto.y][moveto.x] === 0) Game.map.token[moveto.y][moveto.x] = Game.map.token[y][x];
            Game.map.token[y][x] = 0;
            Game.map.owner[y][x] = -1;
          }

        }
      } catch(err) {
        log('err', 'Failed to process a move!');
        console.log(err);
      }
    });

    /* game running messages */
    // >> update block numbers
    // >> update block colors
    // >> update king positions?
    // send changes to players
    this.players.forEach((player)=>{
      this.sendMapFog(player);
    });

    // send leaderboard every third tick
    // if (this.loopcount % 3 === 0)
    this.sendLeaderboard();

    // Ready for next loop
    this.loopcount++;
  }

  static sendLeaderboard() {
    let leaderboard = [];
    this.players.forEach((player)=>{
      leaderboard[player.pid] = {pid: player.pid, units: 0, cells: 0};
    });

    for(let y=0; y<this.map.owner.length; y++){
      for(let x=0; x<this.map.owner[y].length; x++){
        let owner = this.map.owner[y][x];
        if (owner < 0) continue;

        leaderboard[owner].cells++;
        leaderboard[owner].units += this.map.units[y][x];
      }
    }

    // compute outside of loop
    let leadBinary = Schema.pack('leaderboard', {m: 'leaderboard', data: leaderboard});

    this.players.forEach((player)=>{
      if(!player.connected) return false;
      player.ws.sendBinary(leadBinary);
    });
  }

  static sendMapFog(player) {
    if(!player.connected) return false;

    // make blank map with only fog
    let fog = {};
    fog.units = [];
    fog.owner = [];
    fog.token = [];
    for (let k = 0; k < this.map.owner.length; k++) {
      fog.units[k] = [];
      fog.owner[k] = [];
      fog.token[k] = [];
      for (let m = 0; m < this.map.owner[k].length; m++) {
        fog.units[k][m] = 0;
        fog.owner[k][m] = -3;
        fog.token[k][m] = 0;
      }
    }

    // set first oldfog to a blank map (no fog, so the frist send will send fog)
    if (typeof player.oldfog === 'undefined'){
      player.oldfog = {};
      player.oldfog.units = [];
      player.oldfog.owner = [];
      player.oldfog.token = [];
      for (let k = 0; k < this.map.owner.length; k++) {
        player.oldfog.units[k] = [];
        player.oldfog.owner[k] = [];
        player.oldfog.token[k] = [];
        for (let m = 0; m < this.map.owner[k].length; m++) {
          player.oldfog.units[k][m] = 0;
          player.oldfog.owner[k][m] = -1; // empty
          player.oldfog.token[k][m] = 0;
        }
      }
    }

    // copy visible parts into fog
    for (let k = 0; k < this.map.owner.length; k++) {
      for (let m = 0; m < this.map.owner[k].length; m++) {
        // player owns this block
        if (this.map.owner[k][m] === player.pid) {
          let view = 1;
          if (this.map.token[k][m] === 1) view = 2;

          // loop through visible map
          for (var r = -Math.abs(view); r <= Math.abs(view); r++) {
            for (var s = -Math.abs(view); s <= Math.abs(view); s++) {
              // Copy over any existing values
              if (typeof this.map.owner[k+r] !== 'undefined' && typeof this.map.owner[k+r][m+s] !== 'undefined'){
                fog.units[k+r][m+s] = this.map.units[k+r][m+s];
                fog.owner[k+r][m+s] = this.map.owner[k+r][m+s];
                fog.token[k+r][m+s] = this.map.token[k+r][m+s];
              }
            }
          }
        }
        // solid blocks show through the fog
        if (this.map.owner[k][m] === -2) {
          fog.owner[k][m] = this.map.owner[k][m];
        }
        //end
      }
    }

    // get changes in binary
    let mapBit = this.binarMapChanges(fog, player.oldfog);
    if (mapBit !== false) player.ws.sendBinary(mapBit);

    // Set oldfog to compare with next loop
    player.oldfog = Lib.deepCopy(fog);
  }

  static binarMapChanges(map, oldmap) {
    // send only the bits of map that have changed
    let changes = {};
    changes.m = 'mapbit';
    changes.units = [];
    changes.owner = [];
    changes.token = [];
    for(let y=0; y<map.owner.length; y++){
      for(let x=0; x<map.owner[y].length; x++){
        if (map.units[y][x] !== oldmap.units[y][x]) {
          changes.units.push(x);
          changes.units.push(y);
          changes.units.push(map.units[y][x]);
        }
        if (map.owner[y][x] !== oldmap.owner[y][x]) {
          changes.owner.push(x);
          changes.owner.push(y);
          changes.owner.push(map.owner[y][x]);
        }
        if (map.token[y][x] !== oldmap.token[y][x]) {
          changes.token.push(x);
          changes.token.push(y);
          changes.token.push(map.token[y][x]);
        }
      }
    }
    if (changes.units.length > 0 || changes.owner.length > 0 || changes.token.length > 0) return Schema.pack('mapbit', changes);
    else return false;
  }

  static playerDead(pid, killername, killerpid){
    broadcast({m: 'playerdead', pid: pid, timealive: Date.now() - this.starttime, place: this.playersalive, kills: this.players[pid].kills, killer: killername});
    // log('gameplay', '___dead N: ' + this.players[pid].name + ' K: ' + killername + ' T: ' + Lib.humanTimeDiff(this.starttime, Date.now()) + ' P: ' + this.playersalive);
    broadcastChat('Game', this.players[pid].name + ' was taken over by ' + killername);

    this.playersalive--;
    this.deadlogs.push(this.players[pid].name + '<' + killername);
    this.players[pid].dead = true;
    this.players[pid].timedied = Date.now();
    this.players[pid].killerpid = killerpid;
    this.players[pid].place = this.playersalive + 1;
  }

  static endgame(){
    // save stats to database
    clearTimeout(this.forceclose);
    this.running = false;

    let datausage = [];

    try {
      // kick all players
      this.players.forEach((e,i)=>{
        if (!e.connected) return false; // never connected ws
        if (typeof e.dead === 'undefined' || e.dead === false) this.playerDead(e.pid, 'Server', -1);
        datausage.push(e.name + '-' + e.ws.sentBytes + ':' + e.ws.recieveBytes);
        if (e.ws.connected)
          e.ws.close();
      });
    } catch (err){
      log('err', 'Trying to kick everyone from the game!');
    }

    let repoint = [];
    // All the players database stuff
    try {
      // Make the data easier to work with
      let list_uid = [];
      let player_summary = [];
      this.players.forEach((player,i)=>{
        if (typeof player.ws !== 'undefined' && typeof player.ws.uid !== 'undefined') {
          list_uid.push(player.ws.uid);
          player_summary.push({uid: player.ws.uid, place: player.place, points: 0, newpoints: 0, name: player.name, pid: player.pid});
        }
      });

      // Update: pastgames && totalplays
      list_uid.forEach((uid)=>{
        let _set = {};
        _set['$push'] = {pastgames: this.gameid};
        _set['$inc'] = {};
        _set['$inc']['totalplays.' + WORKER_TYPE] = 1;
        db.collection('players').updateOne({id: uid}, _set, function(err, result){
          if(err) {
            log('err', 'Mongodb error.');
            console.log(err);
          }
        });
      });

      // Graceful exit
      if (list_uid.length < 2) throw "Ranking requires 2 players, there are currently " + list_uid.length;

      // pull & update points
      db.collection('players').find({id: {$in: list_uid}}, {_id: 0, points: 1, id: 1}).toArray(function(err, docs) {
        if (err) {
          log('err', 'Error with mongodb points request');
          console.log(err);
        } else if (docs.length > 1) {
          // load points into player summary
          docs.forEach((doc)=>{
            player_summary.forEach((pl)=>{
              if (pl.uid === doc.id) pl.points = typeof doc.points[WORKER_TYPE] === 'undefined' ? 15000 : doc.points[WORKER_TYPE];
            });
          });

          player_summary.sort((a,b)=>{
            if (a.place > b.place) return 1;
            if (a.place < b.place) return -1;
            return 0;
          });

          let point_arr = player_summary.reduce(function(prev, curr) {
            prev.push(curr.points);
            return prev;
          }, []);

          let diff_arr = Rank.multi(point_arr);

          diff_arr.forEach((diff, ind)=>{
            player_summary[ind].newpoints = player_summary[ind].points + diff;
          });

          player_summary.forEach((player)=>{
            let _set = {};
            _set['$set'] = {};
            _set['$set']['points.' + WORKER_TYPE] = player.newpoints;
            db.collection('players').updateOne({id: player.uid}, _set, function(err, result){
              if(err){
                log('err', 'Error setting player points to new points.');
                console.log(err);
              }
            });

            // log friendly version
            repoint.push('' + player.pid + '-' + player.name + ' ' + player.points + '->' + player.newpoints);
          });

          // log point changes
          log('repoint', repoint.join(' | '));
        } else {
          log('err', 'Failed to pull player points from database! No results! No players joined the game?')
        }
      });
    } catch (err){
      log('err', 'Failed to update player points!');
      console.log(err);
    }


    // Add Game to database
    try {
      let gamelog = {};
      gamelog.gid = this.gameid;
      gamelog.type = WORKER_TYPE;
      gamelog.room = '' + WORKER_INDEX + '-' + WORKER_NAME;
      gamelog.numplayers = this.players.length;
      gamelog.players = [];
      this.players.forEach((player,i)=>{
        gamelog.players.push({
          uid: typeof player.ws !== 'undefined' ? player.ws.uid : 'Never Connected!',
          name: player.name,
          color: player.color,
          kills: player.kills,
          place: player.place,
          pid: player.pid,
          killerpid: player.killerpid,
          died: typeof player.timedied !== 'undefined' ? player.timedied : Date.now(),
          exit: typeof player.exit !== 'undefined' ? player.exit : Date.now(),
          datadown: typeof player.ws !== 'undefined' ? player.ws.sentBytes : 'Never Connected!',
          dataup: typeof player.ws !== 'undefined' ? player.ws.recieveBytes : 'Never Connected!'
        });
      });
      gamelog.open = this.starttime;
      gamelog.close = Date.now();
      gamelog.time = Date.now() - this.starttime;
      gamelog.chat = this.chatlogsdata;

      // In database
      db.collection('games').insertOne(gamelog, function(err){
        if(err) {
          log('err', 'Error, MongoDB insert game into games collection!');
          console.log(err);
        }
      });
    } catch (err){
      log('err', 'Failed to add game entry into database!');
      console.log(err);
    }

    // keep track of players
    // log('gameplay', 'Endgame. Time: ' + Lib.humanTimeDiff(this.starttime, Date.now()) + ' Alive: ' + this.playersalive + ' Game: ' + this.gameid);
    log('gamesummary', ' TimeOpen: ' + Lib.humanTimeDiff(this.starttime, Date.now()) + ' Players:' + this.players.length +
      ' Play(' + this.deadlogs.join(' | ') + ') Chat(' + this.chatlogs.join(' | ') + ') Data(' + datausage.join(' | ') + ') Game: ' + this.gameid);

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
function broadcastChat(from, msg) {
  // send chat
  wss.clients.forEach(function each(client) {
    client.sendObj({m: 'chat', from: from, message: msg});
  });
}

function handleMessage(ws, d) {// websocket client messages

  // delay message if game is not running
  if(!Game.running){
    setTimeout(()=>{handleMessage(ws,d)}, 1000);
    return false;
  }

  try{
    if (d.m === 'hi') {
      //ws.sendObj({m: 'hi'});
    }else if (d.m === 'joinroom'){
      if(Game.allowplayers[d.uid] !== 'undefined' && Game.allowplayers[d.uid].secret === d.secret){
        let pid = Game.allowplayers[d.uid].pid;
        if (Game.players[pid].connected) return false; // already connected
        Game.players[pid].ws = ws;
        Game.players[pid].connected = true;
        ws.playing = true;
        ws.pid = pid;
        ws.uid = d.uid;
        ws.secret = d.secret;
        ws.lastchat = Date.now();

        ws.sendObj({m: 'welcome', pid: pid, mapheight: Game.map.owner.length, mapwidth: Game.map.owner[0].length,
          mods: {fog: true}}); // fog no longer needs to be sent. Its just a placeholder for the mods setting.
        ws.sendObj({m: 'players', data: Game.playerarray});// id name color
        ws.sendObj({m: 'chat', from: 'Server', message: 'Welcome to Kingz.io'});
        Game.sendMapFog(Game.players[pid]);
        ws.sendObj({m: 'scrollhome'});
      }
    }else if (d.m === 'move' && ws.playing) {
      if(Game.players[ws.pid].makemove.length > GV.game[WORKER_TYPE].maxmovequeue) return false;
      Game.players[ws.pid].makemove.push(d.move.slice(0, 5));// Make sure a move only has 5 elements
    }else if (d.m === 'chat' && ws.playing){
      if(ws.lastchat < Date.now() - 1000){// longer than 1 second ago
        d.message = '' + d.message; // force string

        var msg = d.message.slice(0,250);
        ws.lastchat = Date.now();
        // broadcast({m: 'chat', from: ws.pid, message: msg});
        broadcastChat(ws.pid, msg);

        log('chat', ws.pid + '-' + Game.players[ws.pid].name + ': ' + msg);
        Game.chatlogs.push(ws.pid + '-' + Game.players[ws.pid].name + ': ' + msg);
        Game.chatlogsdata.push({from: ws.pid, msg: msg});

        if (d.message.length > 250) ws.sendObj({m: 'chat', from: 'Server', message: 'Limit 250 characters.'});
      }else{
        ws.sendObj({m: 'chat', from: 'Server', message: 'Limit 1 message per second.'})
      }
    }
  }catch(err){
    log('err', 'handleMessage error: ' + JSON.stringify(d));
    console.log(err);
  }
}

/* General */
function log(cat, msg){
  if(typeof msg === 'object') {
    msg = JSON.stringify(msg);
  }
  let x = {cat, time: Date.now(), room: WORKER_INDEX + '-' + WORKER_NAME + ' ' + WORKER_TYPE, msg: msg}
  process.send({m: 'pass', to: 'god', data: {m: 'godlog', data: x}});
}

/* Setup */
module.exports.setup = function (p) {
  process = p;
  WORKER_INDEX = process.env.WORKER_INDEX;
  WORKER_PORT = process.env.WORKER_PORT;
  WORKER_NAME = process.env.WORKER_NAME;
  WORKER_TYPE = process.env.WORKER_TYPE;
  NODE_ENV = process.env.NODE_ENV;
  log('startnode', 'Starting [' + NODE_ENV + '] [' + GV.version + ']');

  process.on('message', function (m, c) {// process server messages
    // messages from the process node
    if(m.m === 'broadcast'){
      broadcast(m);
    }else if(m.m === 'addplayer'){
      /* add player spots and start the game loop */
      /* players will start joining and claiming their spot */
      let pid = Game.players.length;
      Game.players[pid] = {connected: false, pid: pid, name: m.name, color: Math.floor(Math.random() * 360), makemove: [], kills: 0};// server version
      Game.playerarray[pid] = {pid: pid, name: m.name, color: Game.players[pid].color};// version that will be sent to player
      Game.allowplayers[m.uid] = {secret: m.secret, pid: pid};
    }else if(m.m === 'start'){
      Game.start();
    }else if (m.m === "getstats"){
      try {
        process.send({
          m: 'pass',
          to: m.rid,
          data: {
            m: 'godmsg',
            s: m.sid,
            msg: '[' + WORKER_INDEX + '-' + WORKER_NAME + '] [' + WORKER_TYPE + ']' + ' Uptime:' + Lib.humanTimeDiff(uptime, Date.now()) + ' Clients:' + wss.clients.length +
            ' Players:' + Game.players.length + ' Playing:' + Game.running +
            ' LastStart:' + (typeof Game.starttime !== 'undefined' ? Lib.humanTimeDiff(Game.starttime, Date.now()) : 'Fresh')
          }
        });
      } catch(err) {
        log('err', 'I failed to send stats to god.');
        console.log(err);
      }
    }else if (m.m === "godchat"){
      try {
        broadcastChat('God', m.msg);
      } catch(err) {
        log('err', 'I failed to send chat to players.');
        console.log(err);
      }
    }
  });

  wss.on('connection', function connection(ws) {
    ws.on('error', function(e) { log('err', 'Got a ws error'); console.log(e); return false; });

    ws.connected = true;
    ws.connecttime = Date.now();
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
      ws.connected = false;
      // log('playerexitgame', 'Time:' + Lib.humanTimeDiff(ws.connecttime, Date.now()) + ' BytesSent:' + ws.sentBytes + ' BytesRecieved:' + ws.recieveBytes);

      try{
        if (typeof ws.pid === 'undefined') return false;
        if (typeof Game.players[ws.pid] === 'undefined' || typeof Game.players[ws.pid].name === 'undefined') return false;
        broadcastChat('Server', '' + Game.players[ws.pid].name + ' has left the game.');
        // log('gameplay', '___exit N: ' + Game.players[ws.pid].name + ' T: ' + Lib.humanTimeDiff(Game.starttime, Date.now()));

        Game.players[ws.pid].exit = Date.now();

        if (wss.clients.length === 0) { // everyone left
          if (Game.running) {
            Game.endgame();
          }
        }
      }catch(err){
        log('err', 'Failed on player ___exit');
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

  // setup game
  Game.setup();

  process.send({m: 'ready'});
};



