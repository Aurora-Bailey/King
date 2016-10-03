import Data from './Data'

var ws = {}
var sendQueue = []
var failStart = 0 // web socket fails to start
Data.state.serverSocket = 'dead'
start()

function start () {
  if (Data.state.serverSocket !== 'dead') return false

  Data.state.serverSocket = 'connecting'
  ws = new window.WebSocket('ws://localhost:9777')

  ws.onopen = () => {
    Data.state.serverSocket = 'ready'
    failStart = 0
    sendObj({m: 'hi'})

    sendObj({m: 'version', version: Data.version})

    sendQueue.forEach((e, i) => {
      sendObj(e)
    })
  }
  ws.onclose = () => {
    Data.state.serverSocket = 'dead'
    Data.state.allowJoin = false
    failStart++
    var timeout = 3000 * failStart
    setTimeout(start, timeout)
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
  } else if (d.m === 'stats') {
    Data.user = d.data
  } else if (d.m === 'ready') {
    Data.state.allowJoin = true
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
