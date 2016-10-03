import Data from './Data'
import GS from './GameSocket'

var ws = {}
var sendQueue = []
var failStart = 0 // web socket fails to start
Data.state.serverSocket = 'dead'
start()

function start () {
  if (Data.state.serverSocket !== 'dead') return false

  Data.state.serverSocket = 'connecting'
  ws = new window.WebSocket('ws://' + Data.server + ':9777')

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
    console.log('ServerSocket closed.')
  }
  ws.onmessage = (e) => {
    var d = JSON.parse(e.data)
    handleMessage(d)
    console.log(d)
  }
}

function handleMessage (d) {
  if (d.m === 'version') {
    if (d.compatible) {
      sendCookie()
    } else {
      window.alert('Your game is out of date! Please refresh your browser.')
    }
  } else if (d.m === 'makecookie') {
    window.localStorage.cookie = d.cookie
    sendCookie()
  } else if (d.m === 'badcookie') {
    console.log('Bad Cookie')
  } else if (d.m === 'setname') {
    console.log('Set name? ' + d.v)
  } else if (d.m === 'stats') {
    Data.user = d.data
  } else if (d.m === 'ready') {
    console.log('ready')
  } else if (d.m === 'join') {
    if (d.v) {
      Data.page = 'waiting'
      Data.waiting.inqueue = true
      Data.waiting.players = 0
      Data.waiting.timeout = d.timeout
      Data.waiting.maxplayers = d.maxplayers
      Data.waiting.minplayers = d.minplayers
    } else {
      window.alert(d.msg)
    }
  } else if (d.m === 'joinupdate') {
    Data.waiting.players = d.players
    Data.waiting.timeout = d.timeout
  } else if (d.m === 'canceljoin') {
    if (d.v) { // value is true or false
      Data.page = 'home'
    }
  } else if (d.m === 'joinroom') {
    GS.start(d.port, d.secret)
  }

  if (typeof d.page !== 'undefined') {
    Data.page = d.page
  }
}

function sendCookie () {
  if (typeof window.localStorage.cookie === 'undefined') {
    console.log('No cookie.')
    sendObj({m: 'makecookie'}, true)
  } else {
    console.log('Cookie')
    sendObj({m: 'cookie', cookie: window.localStorage.cookie}, true)
  }
}

function sendObj (object, queue = false) {
  if (Data.state.serverSocket !== 'ready') {
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
export default {sendObj, shortObj, dummy}
