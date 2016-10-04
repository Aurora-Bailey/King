import Data from './Data'
import SS from './ServerSocket'
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
    SS.sendObj({m: 'gameover'})
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
    Data.game.dead = false
    Data.game.deadscreen.spectate = false
  } else if (d.m === 'map') {
    for (let y = 0; y < d.data.length; y++) {
      if (typeof Data.game.map[y] === 'undefined') Vue.set(Data.game.map, y, [])
      for (let x = 0; x < d.data[y].length; x++) {
        if (typeof Data.game.map[y][x] === 'undefined') {
          Vue.set(Data.game.map[y], x, {solid: 0, units: 0, owner: -1, color: 0, movehelp: 0, king: false, loc: {x: x, y: y}})
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
    d.data.dead = false // inject data into data
    Data.game.players = Object.assign({}, Data.game.players, d.data)
    shortObj({m: 'scrollhome'})
  } else if (d.m === 'chat') {
    if (typeof Data.game.players[d.from] !== 'undefined') {
      Data.game.chat.msg.push('[' + Data.game.players[d.from].name + '] ' + d.message)
    } else {
      Data.game.chat.msg.push('*' + d.from + '* ' + d.message)
    }

    // Delete message after 30 seconds
    setTimeout(() => {
      Data.game.chat.msg.shift()
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

      handleMessage({m: 'chat', from: 'Game', message: Data.game.players[d.pid].name + ' was taken over by ' + d.killer})
    }
  } else if (d.m === 'scrollhome') {
    // this is in the web socke to be called when the game starts
    // in the game.vue there is not defining line where the game starts
    let w = window.innerWidth
    let h = window.innerHeight
    let kingloc = Data.game.players[Data.game.myid].kingloc

    Data.game.scroll.x = (kingloc.x * 50) - (w / 2) + 25
    Data.game.scroll.x = -Data.game.scroll.x
    Data.game.scroll.y = (kingloc.y * 50) - (h / 2) + 25
    Data.game.scroll.y = -Data.game.scroll.y
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
      console.log('object added to web socket queue')
    } else {
      console.warn('Game server is not connected.')
      window.alert('Game server is not connected.')
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
export default {sendObj, shortObj, start, close, dummy}
