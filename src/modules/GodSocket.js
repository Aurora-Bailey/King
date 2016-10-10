import Data from './Data'

var ws = {}
var sendQueue = []
var failStart = 0 // web socket fails to start
Data.state.godSocket = 'dead'

// Listen
window.addEventListener('keydown', (e) => {
  if (e.keyCode === 191 && e.shiftKey && e.ctrlKey) {
    Data.god.show = !Data.god.show
    if (Data.god.show) start()
  }
}, false)

function start () {
  if (Data.state.godSocket !== 'dead') return false

  Data.state.godSocket = 'connecting'
  if (Data.dev.on) {
    ws = new window.WebSocket('ws://' + Data.dev.server + ':' + Data.god.port)
  } else {
    ws = new window.WebSocket('ws://' + Data.server + '/' + Data.god.nameport)
  }

  ws.onopen = () => {
    if (ws.connected) return false // already connected

    ws.connected = true
    Data.state.godSocket = 'ready'
    failStart = 0

    sendObj({m: 'hi'})
    sendCookie()

    sendQueue.forEach((e, i) => {
      sendObj(e)
    })
  }
  ws.onclose = () => {
    ws.connected = false
    Data.state.godSocket = 'dead'
    failStart++
    var timeout = 3000 * failStart
    setTimeout(start, timeout)
    console.warn('ServerSocket closed.')
  }
  ws.onmessage = (e) => {
    var d = JSON.parse(e.data)
    handleMessage(d)
    console.log(d)
  }
}

function sendCookie () {
  if (typeof window.localStorage.cookie === 'undefined') {
    shortObj({m: 'output', msg: 'No Cookies!'})
  } else {
    sendObj({m: 'cookie', cookie: window.localStorage.cookie}, true)
  }
}
function handleMessage (d) {
  if (d.m === 'output') {
    Data.god.msg.push(d.msg)
  }

  if (typeof d.page !== 'undefined') {
    Data.page = d.page
  }
  if (typeof d.clear !== 'undefined') {
    while (Data.god.msg.length > 0) {
      Data.god.msg.pop()
    }
  }
}

function sendObj (object, queue = false) {
  if (Data.state.godSocket !== 'ready') {
    if (queue) {
      sendQueue.push(object)
      console.log('object added to web socket queue')
    } else {
      console.warn('WebSocket is not connected.')
      Data.popup.show('Connection', 'You are not connected to the GOD server!')
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
