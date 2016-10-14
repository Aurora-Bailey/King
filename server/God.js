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
  process = false,
  uptime = Date.now(),
  WORKER_PORT = false,
  WORKER_NAME = false,
  WORKER_INDEX = false,
  WORKER_TYPE = false,
  NODE_ENV = false,
  temp_logs = {};

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
function sendLog(data) {
  wss.clients.forEach(function each(client) {
    if (client.mod === 'god' && client.getlogs){
      client.sendObj({m: 'output', msg: beautifyLog(data)});
    }
  });
}
function beautifyLog(logObj) {
  let {cat, time, room, msg} = logObj;

  return '[' + Lib.humanTimeDate(time) + '][' + room + '][' + cat + '] = ' + msg

}
function handleMessage(ws, d) {// websocket client messages
  try{
    if (d.m === 'hi') {
      //ws.sendObj({m: 'hi'});
    } else if (d.m === 'cookie') {
      db.collection('players').find({cookie: d.cookie}, {_id: 0, mod: 1, name: 1}).limit(1).toArray(function(err, docs) {
        if (err) {
          ws.sendObj({m: 'output', msg: 'Bad Cookie!'});
          log('err', 'Error with mongodb cookie request');
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

        // Log stuff
        if (query[0] === 'logs') {

          // Second word
          if (typeof query[1] !== 'undefined') {
            // send to specific node or type
            if (query[1] === 'on') {
              ws.getlogs = true;
              ws.sendObj({m: 'output', msg: '=== Logs are on ==='});
            } else if (query[1] === 'off') {
              ws.getlogs = false;
              ws.sendObj({m: 'output', msg: '=== Logs are off ==='});
            }
          } else {
            // No arguments
            // spit out all temp logs
            let logKeys = Object.keys(temp_logs);
            logKeys.forEach((e,i)=>{
              ws.sendObj({m: 'output', msg: '=== Logs for ' + e + ' ==='});
              temp_logs[e].forEach((ele, ind)=>{
                ws.sendObj({m: 'output', msg: beautifyLog(ele)});
              });
            });
          }
        }

        // Pull logs from database
        if (query[0] === 'mongologs') { // mongologs cat [hours]

          if (typeof query[1] === 'undefined') return false;
          if (typeof query[2] === 'undefined') query[2] = 24; // default to 24

          let [mongologs, cat, hours] = query;

          db.collection('logs').find({cat: cat, time: {$gt: Date.now() - hours*60*60*1000}}).toArray(function(err, docs) {
            if (err) {
              log('err', 'Error with mongodb logdb request');
              console.log(err);
            } else if (docs.length != 0) {
              docs.forEach((e,i)=>{
                ws.sendObj({m: 'output', msg: beautifyLog(e)});
              });
            }
          });
        }


        // chat
        // send message to a game room chat
        // currently only game rooms listen for this.
        if (query[0] === 'chat') {

          // Second word
          if (typeof query[1] !== 'undefined') {
            // send to specific node or type
            let buildmsg = [];
            query.forEach((e,i)=>{// skip first two elements
              if (i > 1) {
                buildmsg.push(e);
              }
            });
            process.send({m: 'pass', to: query[1], data: {m: 'godchat', msg: buildmsg.join(' ')}});
          } else {
            // No arguments
          }
        }

        // Live
        // run a command multiple times
        // live secInterval num clear command here
        if (query[0] === 'live') {

          try {
            if (typeof query[1] !== 'undefined' &&
              typeof query[2] !== 'undefined' &&
              typeof query[3] !== 'undefined' &&
              typeof query[4] !== 'undefined' && ws.connected) {

              let live = query[0];
              let interval = parseInt(query[1]);
              let numRepeat = parseInt(query[2]);
              let clear = query[3];

              let buildmsg = [];
              query.forEach((e,i)=>{// skip first 4 elements
                if (i > 3) {
                  buildmsg.push(e);
                }
              });
              let command = buildmsg.join(' ');
              let commandWithIndex = command.replace('{i}', '' + numRepeat);

              // run the command
              handleMessage(ws, {m: 'input', msg: commandWithIndex})

              // run live again
              if (numRepeat > 1 && ws.connected) {
                numRepeat--;
                setTimeout(()=>{
                  if (clear == 'true') ws.sendObj({m: 'clear', clear: 'clear'});
                  handleMessage(ws, {m: 'input', msg: live + ' ' + interval + ' ' + numRepeat + ' ' + clear + ' ' + command})
                }, interval * 1000)
              }

            }
          } catch(err) {
            console.log(err);
            log('err', 'error with live');
          }

        }

        // help
        if (query[0] === 'help') {
          ws.sendObj({m: 'output', msg: 'status [id/type/all] - Status of every node. Options specific node/s'});
          ws.sendObj({m: 'output', msg: 'logs - Past 10 logs in each category'});
          ws.sendObj({m: 'output', msg: 'logs on/off - Turn on/off live logs'});
          ws.sendObj({m: 'output', msg: 'mongologs cat [hours] - Pull logs of a category from database, time opt default 24.'});
          ws.sendObj({m: 'output', msg: 'chat id/type/all string of text - Send chat message to room. options required'});
          ws.sendObj({m: 'output', msg: 'live secInterval numRepeat clearWindow command - Repeat a command. {i} for index'});
        }
      }

    }
    // Example broadcast to all nodes
    // process.send({m: 'pass', to: 'server', data: {m: 'broadcast', message: d.message, level: d.level}});
  }catch(err){
    log('err', 'handleMessage error: ' + JSON.stringify(d));
    console.log(d);
    console.log(err);
  }
}

/* General */
function log(cat, msg){
  if(typeof msg === 'object') {
    msg = JSON.stringify(msg);
  }

  let x = {cat: cat, time: Date.now(), room: WORKER_INDEX + '-' + WORKER_NAME + ' ' + WORKER_TYPE, msg: msg}
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

  process.on('message', function (m) {// process server messages
    if (m.m === "godmsg") {
      sendToSid(m.s, {m: 'output', msg: m.msg});
    } else if (m.m === "godlog") {
      sendLog(m.data); // to any listening gods

      // save
      if(typeof temp_logs[m.data.cat] === 'undefined') temp_logs[m.data.cat] = [];
      temp_logs[m.data.cat].push(m.data);
      if(temp_logs[m.data.cat].length > 10){
        temp_logs[m.data.cat].shift();
      }

      // In database
      db.collection('logs').insertOne(m.data, function(err){
        if(err) {
          // not log() ing this one because it could cause an infinite loop
          console.log(err);
        }
      });
    } else if (m.m === "getstats"){
      try {
        process.send({
          m: 'pass',
          to: m.rid,
          data: {
            m: 'godmsg',
            s: m.sid,
            msg: '[' + WORKER_INDEX + '-' + WORKER_NAME + '] [' + WORKER_TYPE + ']' + ' Uptime:' + Lib.humanTimeDiff(uptime, Date.now()) + ' Clients:' + wss.clients.length + ' Names:' + nameClients()
          }
        });
      } catch(err) {
        log('err', 'I failed to send stats to ' + WORKER_TYPE + '.');
        console.log(err);
      }
    }
  });

  wss.on('connection', function connection(ws) {
    ws.on('error', function(e) { log('er', 'Got a ws error'); console.log(e); return false; });

    // don't use ws.domain or ws.extensions
    ws.connected = true;
    ws.start = Date.now();
    ws.name = 'Unknown';
    ws.mod = false;
    ws.getlogs = false;
    ws.sid = Lib.md5(Math.random() + Date.now());
    ws.sendObj = function (obj) {
      if(!ws.connected) return false;

      try {
        ws.send(JSON.stringify(obj));
      } catch (err) {
        log('wsout', 'I failed to send a message.');
      }
    };
    ws.sendBinary = function(data){
      if(!ws.connected) return false;

      try{
        ws.send(data, {binary: true});
      }catch(err){
        log('wsout', 'I failed to send binary a message.');
      }
    };
    ws.on('message', function incoming(data) {
      try {
        if (typeof data === 'string') {
          handleMessage(ws, JSON.parse(data))
        } else {
          var buf = new Buffer(data, 'binary')
          handleMessage(ws, Schema.unpack(buf))
        }
      }
      catch (err) {
        log('err', 'HACKER!!! AKA bad client message. ' + JSON.stringify(data));
        console.log(data);
        console.log(err);
      }
    });

    ws.on('close', function () {
      log('godconsole', ws.name + ' has left.');
      ws.connected = false;
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
};

