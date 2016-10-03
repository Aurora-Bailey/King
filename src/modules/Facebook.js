/* eslint-disable */
import Data from './Data'
import WebSocket from './WebSocket'

// Load the SDK asynchronously
(function (d, s, id) {
  console.log('asdfqwerty')
  var js
  var fjs = d.getElementsByTagName(s)[0]
  if (d.getElementById(id)) return
  js = d.createElement(s)
  js.id = id
  js.src = '//connect.facebook.net/en_US/sdk.js'
  fjs.parentNode.insertBefore(js, fjs)
}(document, 'script', 'facebook-jssdk'))

// This is called when the sdk is fully loaded
window.fbAsyncInit = () => {
  FB.init({
    appId: '103746836756937',
    cookie: true,
    xfbml: true,
    version: 'v2.7'
  })
  Data.state.fbsdk = true
  token()
}

function login () {
  if (!Data.state.fbsdk) return false

  FB.login((response) => {
    if (response.status === 'connected') {
      WebSocket.sendObj({m: 'login', token: response.authResponse.accessToken})
      WebSocket.shortObj({m: 'login', token: response.authResponse.accessToken})
    } else {
      WebSocket.sendObj({m: 'login', token: false})
      WebSocket.shortObj({m: 'login', token: false})
    }
  }, {scope: 'public_profile,email,user_friends'})
}

function token () {
  if (!Data.state.fbsdk) return false

  FB.getLoginStatus((response) => {
    if (response.status === 'connected') {
      WebSocket.sendObj({m: 'login', token: response.authResponse.accessToken}, true)
      WebSocket.shortObj({m: 'login', token: response.authResponse.accessToken}, true)
    } else {
      WebSocket.sendObj({m: 'login', token: false}, true)
      WebSocket.shortObj({m: 'login', token: false}, true)
    }
  })
}

function logout () {
  if (!Data.state.fbsdk) return false

  FB.logout((response) => {
    WebSocket.sendObj({m: 'login', token: false})
    WebSocket.shortObj({m: 'login', token: false})
  })
}

export default {login, token, logout}
/* eslint-enable */
