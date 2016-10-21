import Data from './Data'
import SS from './ServerSocket'
import Vue from 'vue'
var Schema = require('../../server/Schema')

var ws = {}
var sendQueue = []
Data.state.gameSocket = 'dead'

function start (obj) {
  if (Data.state.gameSocket !== 'dead') return false

  Data.state.gameSocket = 'connecting'
  if (Data.dev.on) {
    ws = new window.WebSocket('ws://' + Data.dev.server + ':' + obj.port)
  } else {
    ws = new window.WebSocket('ws://' + Data.server + '/' + obj.name)
  }

  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    if (ws.connected) return false // already connected

    ws.connected = true
    Data.state.gameSocket = 'ready'

    sendObj({m: 'hi'})
    sendObj({m: 'joinroom', uid: Data.user.id, secret: obj.secret})

    sendQueue.forEach((e, i) => {
      sendObj(e)
    })
  }
  ws.onclose = () => {
    ws.connected = false
    Data.state.gameSocket = 'dead'
    // console.log('GameSocket closed.')
    Data.page = 'home'
    Vue.set(Data.game, 'map', [])
    Vue.set(Data.game, 'leaderboard', [])
    SS.sendObj({m: 'gameover'})
  }
  ws.onmessage = (e) => {
    if (typeof e.data === 'string') {
      handleMessage(JSON.parse(e.data))
    } else {
      var buf = new Buffer(e.data, 'binary')
      handleMessage(Schema.unpack(buf))
    }
  }
}

function setLeaderboard (players) {
  Vue.set(Data.game, 'leaderboard', [])
  for (let i = 0; i < players.length; i++) {
    Data.game.leaderboard.push({
      name: players[i].name,
      color: 'hsl(' + players[i].color + ',100%,80%)',
      pid: players[i].pid,
      units: 0,
      blocks: 0
    })
  }
}
function updateLeaderboard (data) {
  for (let i = 0; i < Data.game.leaderboard.length; i++) {
    Data.game.leaderboard[i].units = 0
    Data.game.leaderboard[i].blocks = 0
  }

  data.forEach((lead) => {
    Data.game.leaderboard.forEach((old) => {
      if (old.pid === lead.pid) {
        old.blocks = lead.cells
        old.units = lead.units
      }
    })
  })

  Data.game.leaderboard.sort(function (a, b) {
    if (a.units > b.units) return -1
    if (a.units < b.units) return 1
    if (a.blocks > b.blocks) return -1
    if (a.blocks < b.blocks) return 1
    return 0
  })
}

function updateCellColors (x, y) {
  let id = Data.game.map[y][x].owner
  if (typeof Data.game.players[id] !== 'undefined') { // cell has player owner
    Data.game.map[y][x].color = 'hsl(' + Data.game.players[id].color + ',100%,50%)'
  } else { // un-owned block
    if (Data.game.map[y][x].owner === -4) { // City
      Data.game.map[y][x].color = '#FFF'
    } else if (Data.game.map[y][x].owner === -3) { // Fog
      Data.game.map[y][x].color = '#DDD'
    } else if (Data.game.map[y][x].owner === -2) { // Solid
      Data.game.map[y][x].color = '#000'
    } else if (Data.game.map[y][x].owner === -1) { // Empty
      Data.game.map[y][x].color = '#FFF'
    } else { // Other idk
      Data.game.map[y][x].color = 'cyan'
    }
  }
}

function handleMessage (d) {
  if (d.m === 'welcome') {
    // Settings
    let fog = false

    // Modify settings
    if (typeof d.mods !== 'undefined') {
      if (d.mods.fog) {
        fog = true // This value is not used any more, its just a place holder for the settings structure
      }
    }

    Vue.set(Data.game, 'players', [])
    Vue.set(Data.game, 'myid', d.pid)

    // Set up map
    Vue.set(Data.game, 'map', [])
    for (let y = 0; y < d.mapheight; y++) {
      Vue.set(Data.game.map, y, [])
      for (let x = 0; x < d.mapwidth; x++) {
        Vue.set(Data.game.map[y], x, {units: 0, owner: -1, token: 0, color: 'white', highlight: false, move_help: 0, moving: false, loc: {x: x, y: y}})
      }
    }

    // Play sound
    let sound = document.getElementById('game_ready_sound')
    if (sound.canPlayType('audio/mpeg')) {
      sound.currentTime = 0
      sound.play()
    }

    Data.page = 'game'
    Data.game.playing = true
    Data.game.dead = false
    Data.game.deadscreen.spectate = false
  } else if (d.m === 'map') {
    for (let y = 0; y < Data.game.map.length; y++) {
      for (let x = 0; x < Data.game.map[y].length; x++) {
        if (d.units.length > 0) Data.game.map[y][x].units = d.units[y][x]
        if (d.owner.length > 0) Data.game.map[y][x].owner = d.owner[y][x]
        if (d.token.length > 0) Data.game.map[y][x].token = d.token[y][x]

        // Compute color
        if (d.owner.length > 0) updateCellColors(x, y)
      }
    }
  } else if (d.m === 'mapbit') {
    // changes, sent in blocks of 3 joined on a single array
    for (let i = 0; i < d.units.length; i += 3) {
      let x = d.units[i]
      let y = d.units[i + 1]
      let z = d.units[i + 2]
      Data.game.map[y][x].units = z
    }
    for (let i = 0; i < d.owner.length; i += 3) {
      let x = d.owner[i]
      let y = d.owner[i + 1]
      let z = d.owner[i + 2]
      Data.game.map[y][x].owner = z
      // Compute color
      updateCellColors(x, y)
    }
    for (let i = 0; i < d.token.length; i += 3) {
      let x = d.token[i]
      let y = d.token[i + 1]
      let z = d.token[i + 2]
      Data.game.map[y][x].token = z
    }
  } else if (d.m === 'players') {
    d.data.dead = false // inject data into data
    Data.game.players = Object.assign({}, Data.game.players, d.data)
    setLeaderboard(d.data)
  } else if (d.m === 'movedone') {
    Data.game.map[d.y][d.x].moving = false
  } else if (d.m === 'leaderboard') {
    updateLeaderboard(d.data)
  } else if (d.m === 'chat') {
    if (typeof Data.game.players[d.from] !== 'undefined') {
      // Data.game.chat.msg.push('[' + Data.game.players[d.from].name + '] ' + d.message)
      Data.game.chat.msg.push({
        msg: d.message,
        name: Data.game.players[d.from].name,
        color: 'hsl(' + Data.game.players[d.from].color + ',100%,80%)'
      })
      // From player - Play sound
      if (d.from !== Data.game.myid) {
        let sound = document.getElementById('game_message_sound')
        if (sound.canPlayType('audio/mpeg')) {
          sound.currentTime = 0
          sound.play()
        }
      }
    } else {
      // Data.game.chat.msg.push('*' + d.from + '* ' + d.message)
      let color = 'hsl(0,0%,70%)'
      if (d.from === 'Game') color = 'hsl(0,0%,100%)'
      if (d.from === 'God') color = 'hsl(0,100%,50%)'
      Data.game.chat.msg.push({
        msg: d.message,
        name: d.from,
        color: color
      })
    }

    // archive message after 30 seconds
    setTimeout(() => {
      Data.game.chat.history.push(Data.game.chat.msg.shift())
    }, 30000)
  } else if (d.m === 'playerdead') {
    // make sure player exists
    if (typeof Data.game.players[d.pid] !== 'undefined') {
      Data.game.players[d.pid].dead = true
      if (d.pid === Data.game.myid) {
        // you are dead
        Data.game.dead = true
        Data.game.deadscreen.name = Data.game.players[d.pid].name
        Data.game.deadscreen.killer = d.killer
        let time = d.timealive
        time /= 1000 // convert from miliseconds to seconds
        let minutes = Math.floor(time / 60)
        let sec = Math.floor(time % 60)
        if (sec < 10) {
          sec = '0' + sec
        }
        let humantime = minutes + ':' + sec
        Data.game.deadscreen.playtime = humantime
        Data.game.deadscreen.place = d.place
        Data.game.deadscreen.kills = d.kills
      } else {
        // someone else is dead
      }

      // handleMessage({m: 'chat', from: 'Game', message: Data.game.players[d.pid].name + ' was taken over by ' + d.killer})
    }
  } else if (d.m === 'scrollhome') {
    // Call this only when the map is loaded

    let client = {}
    client.w = window.innerWidth
    client.h = window.innerHeight

    let map = {}
    map.w = Data.game.map[0].length * 50
    map.h = Data.game.map.length * 50

    let king = {}
    king.x = map.w / 2
    king.y = map.h / 2
    for (let y = 0; y < Data.game.map.length; y++) {
      for (let x = 0; x < Data.game.map[y].length; x++) {
        if (Data.game.map[y][x].owner === Data.game.myid && Data.game.map[y][x].token === 1) {
          king.x = (x + 1) * 50
          king.y = (y + 1) * 50
        }
      }
    }

    let scroll = {}
    scroll.w = (client.w / 2) - (map.w / 2)
    if (map.w > client.w) {
      scroll.w = (client.w / 2) - king.x + 25
      if (scroll.w > 0) scroll.w = 0
      if (scroll.w < client.w - map.w) scroll.w = client.w - map.w
    }
    scroll.h = (client.h / 2) - (map.h / 2)
    if (map.h > client.h) {
      scroll.h = (client.h / 2) - king.y + 25
      if (scroll.h > 0) scroll.h = 0
      if (scroll.h < client.h - map.h) scroll.h = client.h - map.h
    }

    Data.game.scroll.x = scroll.w
    Data.game.scroll.y = scroll.h
  }

  if (typeof d.page !== 'undefined') {
    Data.page = d.page
  }
}

function close () {
  if (Data.state.gameSocket !== 'ready') return false
  ws.close()
}

function sendObj (object, queue = false) {
  if (Data.state.gameSocket !== 'ready') {
    if (queue) {
      sendQueue.push(object)
      // console.log('object added to web socket queue')
    } else {
      console.warn('Game server is not connected.')
      Data.popup.show('Connection', 'You are not connected to the game server!')
    }
    return false
  }
  ws.send(JSON.stringify(object))
}

function sendBinary (binary) {
  if (Data.state.serverSocket !== 'ready') {
    console.warn('WebSocket is not connected.')
    Data.popup.show('Connection', 'You are not connected to the server!')
    return false
  }
  ws.send(binary, { binary: true, mask: true })
}

// short circuit, skip the WebSocket.
function shortObj (object) {
  handleMessage(object)
}

export default {sendObj, shortObj, sendBinary, start, close}
