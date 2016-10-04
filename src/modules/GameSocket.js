import Data from './Data'
import Vue from 'vue'

var ws = {}
var sendQueue = []
Data.state.gameSocket = 'dead'

function start (port, secret) {
  if (Data.state.gameSocket !== 'dead') return false

  Data.state.gameSocket = 'connecting'
  ws = new window.WebSocket('ws://' + Data.server + ':' + port)

  ws.onopen = () => {
    if (ws.connected) return false // already connected

    ws.connected = true
    Data.state.gameSocket = 'ready'

    sendObj({m: 'hi'})
    sendObj({m: 'joinroom', uid: Data.user.id, secret: secret})

    sendQueue.forEach((e, i) => {
      sendObj(e)
    })
  }
  ws.onclose = () => {
    ws.connected = false
    Data.state.gameSocket = 'dead'
    console.log('GameSocket closed.')
    Data.page = 'home'
  }
  ws.onmessage = (e) => {
    var d = JSON.parse(e.data)
    handleMessage(d)
    console.log(d)
  }
}

function handleMessage (d) {
  if (d.m === 'welcome') {
    Vue.set(Data.game, 'map', [])
    Vue.set(Data.game, 'players', [])
    Vue.set(Data.game, 'myid', d.pid)

    Data.page = 'game'
    Data.game.playing = true
  } else if (d.m === 'map') {
    for (let y = 0; y < d.data.length; y++) {
      if (typeof Data.game.map[y] === 'undefined') Vue.set(Data.game.map, y, [])
      for (let x = 0; x < d.data[y].length; x++) {
        if (typeof Data.game.map[y][x] === 'undefined') {
          Vue.set(Data.game.map[y], x, {solid: 0, units: 0, owner: -1, color: 0, king: false, loc: {x: x, y: y}})
        }

        Vue.set(Data.game.map[y][x], d.type, d.data[y][x])

        if (d.type === 'owner') {
          let id = Data.game.map[y][x].owner

          if (typeof Data.game.players[id] !== 'undefined' && typeof Data.game.players[id].color !== 'undefined') {
            // cell has owner

            // compute king
            let kingloc = Data.game.players[id].kingloc
            if (kingloc.x === x && kingloc.y === y) {
              Vue.set(Data.game.map[y][x], 'king', true)
            } else {
              Vue.set(Data.game.map[y][x], 'king', false)
            }

            // compute color
            Vue.set(Data.game.map[y][x], 'color', 'hsl(' + Data.game.players[id].color + ',100%,50%)')
          } else {
            // un-owned block

            // comput color
            if (Data.game.map[y][x].solid === 1) {
              Vue.set(Data.game.map[y][x], 'color', 'hsl(0,100%,0%)')
            } else {
              Vue.set(Data.game.map[y][x], 'color', 'hsl(0,100%,100%)')
            }
          }
        }
      }
    }
  } else if (d.m === 'players') {
    // Data.game.players = d.data
    Data.game.players = Object.assign({}, Data.game.players, d.data)
  }

  if (typeof d.page !== 'undefined') {
    Data.page = d.page
  }
}

function sendObj (object, queue = false) {
  if (Data.state.gameSocket !== 'ready') {
    if (queue) {
      sendQueue.push(object)
      console.log('object added to web socket queue')
    } else {
      window.alert('WebSocket is not connected.')
    }
    return false
  }
  ws.send(JSON.stringify(object))
}

// short circuit, skip the WebSocket.
function shortObj (object) {
  handleMessage(object)
}

var dummy = 'placeholder to keep lint happy'
export default {sendObj, shortObj, start, dummy}
