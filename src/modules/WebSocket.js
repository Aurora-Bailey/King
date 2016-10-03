import Data from './Data'

var ws = {}
var sendQueue = []
var failStart = 0 // web socket fails to start
Data.state.ws = 'dead'
start()

function start () {
  if (Data.state.ws !== 'dead') return false

  Data.state.ws = 'connecting'
  ws = new window.WebSocket('ws://localhost:8777')

  ws.onopen = () => {
    setTimeout(function () {
      Data.state.ws = 'ready'
      failStart = 0
      sendObj({m: 'hi'})

      sendQueue.forEach((e, i) => {
        sendObj(e)
      })
    }, 2000)
  }
  ws.onclose = () => {
    Data.state.ws = 'dead'
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
  if (d.m === 'login') {
    if (d.token === false) {
      Data.state.login = 'request'
    } else {
      Data.state.login = 'done'
    }
  } else if (d.m === 'signup') {
    Data.state.signup = 'done'
  }

  if (typeof d.page !== 'undefined') {
    Data.page = d.page
  }
}

function sendObj (object, queue = false) {
  if (Data.state.ws !== 'ready') {
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
