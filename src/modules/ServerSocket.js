import Data from './Data'
import GS from './GameSocket'
var Schema = require('../../server/Schema')

var ws = {}
var sendQueue = []
var failStart = 0 // web socket fails to start
Data.state.serverSocket = 'dead'
start()

function start () {
  if (Data.state.serverSocket !== 'dead') return false

  Data.state.serverSocket = 'connecting'
  if (Data.dev.on) {
    ws = new window.WebSocket('ws://' + Data.dev.server + ':' + Data.dev.port)
  } else {
    ws = new window.WebSocket('ws://' + Data.server)
  }

  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    if (ws.connected) return false // already connected

    ws.connected = true
    Data.state.serverSocket = 'ready'
    failStart = 0

    sendObj({m: 'hi'})
    sendObj({m: 'version', version: Data.version})

    sendQueue.forEach((e, i) => {
      sendObj(e)
    })
  }
  ws.onclose = () => {
    ws.connected = false
    Data.state.serverSocket = 'dead'
    failStart++
    var timeout = 3000 * failStart
    setTimeout(start, timeout)
    if (Data.page === 'waiting') {
      Data.page = 'home'
    }
    console.warn('ServerSocket closed.')
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

function handleMessage (d) {
  if (d.m === 'version') {
    if (d.compatible) {
      sendCookie()
    } else {
      console.warn('Your game is out of date! Please refresh your browser.')
      Data.popup.show('Out of date', 'Your game is out of date! Please refresh your browser.')
    }
  } else if (d.m === 'timeout') {
    sendObj({m: 'timeout', alive: true})
  } else if (d.m === 'makecookie') {
    window.localStorage.cookie = d.cookie
    sendCookie()
  } else if (d.m === 'badcookie') {
    console.warn('Bad Cookie')
    if (window.confirm('Cookie not found! Reload your browser to try again. If your cookie is still not found hit ok to make a new cookie. (Warning: You will lose access to your old account!)') === false) return false
    if (window.confirm('WARNING!!! You are about to reset the cookie that links to your account! Are you okay with this?') === false) return false
    window.localStorage.removeItem('cookie')
    sendCookie()
  } else if (d.m === 'setname') {
    // console.log('Set name? ' + d.v)
  } else if (d.m === 'leaderboard') {
    for (let i = 0; i < d.data.length; i++) { // set rank to the same if points are the same
      if (typeof d.data[i - 1] !== 'undefined' && d.data[i - 1].points === d.data[i].points) {
        d.data[i].rank = d.data[i - 1].rank
      } else {
        d.data[i].rank = i + 1
      }
    }
    Data.leaderboard = Object.assign({}, Data.leaderboard, d.data)
  } else if (d.m === 'stats') {
    Data.user.id = d.data.id
    Data.user.name = d.data.name
    // more stats may come later (ex: total plays)
  } else if (d.m === 'myrank') {
    Data.user.rank = d.rank
    Data.user.points = d.points
  } else if (d.m === 'ready') {
    // console.log('ready')
  } else if (d.m === 'join') {
    if (d.v) {
      Data.page = 'waiting'
      Data.waiting.inqueue = true
      Data.waiting.players = 0
      Data.waiting.timeout = Date.now() + 5000
      Data.waiting.maxplayers = d.maxplayers
      Data.waiting.minplayers = d.minplayers
    } else {
      if (typeof d.msg !== 'undefined') {
        console.warn(d.msg)
        Data.popup.show('Failed to join', d.msg)
      }
    }
  } else if (d.m === 'joinupdate') {
    Data.waiting.players = d.players
    Data.waiting.timeout = d.timeout
    if (d.note === 'full') Data.popup.show('All rooms are full', 'Please wait a minute for a new room to open up.')
  } else if (d.m === 'canceljoin') {
    if (d.v) { // value is true or false
      Data.waiting.inqueue = false
      Data.page = 'home'
    }
  } else if (d.m === 'joinroom') {
    Data.waiting.inqueue = false
    if (typeof d.name !== 'undefined') {
      GS.start({name: d.name, secret: d.secret})
    } else {
      GS.start({port: d.port, secret: d.secret})
    }
  } else if (d.m === 'popup') {
    Data.popup.show(d.title, d.msg)
  } else if (d.m === 'gamelist') {
    // empty list
    while (Data.gamelist.length > 0) {
      Data.gamelist.pop()
    }
    // rebuild list
    d.v.forEach((e, i) => {
      Data.gamelist.push(e)
    })
  } else if (d.m === 'q') {
    Data.gamelist.forEach((e, i) => {
      if (e.type === d.type) {
        e.cur = d.n
      }
    })
  }

  if (typeof d.page !== 'undefined') {
    Data.page = d.page
  }
}

function sendCookie () {
  if (typeof window.localStorage.cookie === 'undefined') {
    // console.log('No cookie.')
    sendObj({m: 'makecookie'}, true)
  } else {
    // console.log('Cookie')
    sendObj({m: 'cookie', cookie: window.localStorage.cookie}, true)
  }
}

function sendObj (object, queue = false) {
  if (Data.state.serverSocket !== 'ready') {
    if (queue) {
      sendQueue.push(object)
      // console.log('object added to web socket queue')
    } else {
      console.warn('WebSocket is not connected.')
      Data.popup.show('Connection', 'You are not connected to the server!')
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

export default {sendObj, shortObj, sendBinary}
