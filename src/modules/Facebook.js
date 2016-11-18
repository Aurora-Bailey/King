/* eslint-disable */
import WebSocket from './ServerSocket'

// Load the SDK asynchronously
(function (d, s, id) {
  let js
  let fjs = d.getElementsByTagName(s)[0]
  if (d.getElementById(id)) return
  js = d.createElement(s)
  js.id = id
  js.src = '//connect.facebook.net/en_US/sdk.js'
  fjs.parentNode.insertBefore(js, fjs)
}(document, 'script', 'facebook-jssdk'))

// This is called when the sdk is fully loaded
window.fbAsyncInit = () => {
  FB.init({
    appId: '938283472970850',
    cookie: true,
    xfbml: true,
    version: 'v2.8'
  })
}

function login () {
  FB.login((response) => {
    if (response.status === 'connected') {
      WebSocket.sendObj({m: 'loginfb', token: response.authResponse.accessToken})
    } else {
      WebSocket.sendObj({m: 'loginfb', token: false})
    }
  }, {scope: 'public_profile'})
}

function token () {
  FB.getLoginStatus((response) => {
    if (response.status === 'connected') {
      WebSocket.sendObj({m: 'loginfb', token: response.authResponse.accessToken}, true)
    } else {
      WebSocket.sendObj({m: 'loginfb', token: false}, true)
    }
  })
}

function logout () {
  FB.getLoginStatus((response) => {
    if (response.status === 'connected') {
      FB.logout((response) => {
        // Log out of facebook client side
      })
    }
  })
  WebSocket.sendObj({m: 'loginfb', token: false})
}

export default {login, token, logout}
/* eslint-enable */
