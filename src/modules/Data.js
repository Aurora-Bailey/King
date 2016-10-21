export default {
  version: 'FH9M2', // This version converts from single game to multi game
  dev: {
    on: window.location.hostname === 'localhost',
    server: 'localhost',
    port: '7777'
  },
  server: 'ws.kingz.io',
  page: 'home',
  gamelist: [],
  user: {
    id: 0,
    name: '',
    lastlogin: 0,
    numplays: 0,
    points: 0,
    rank: 0,
    microversion: 'v2000',
    notes: [
      {title: 'Update 10/21', text: 'New game mode! \n New ranking system! \n (and other stuff)'}
    ]
  },
  leaderboard: [],
  waiting: {
    players: 9000,
    timeout: Date.now(),
    inqueue: false,
    maxplayer: 100,
    minplayers: 1,
    tips: ['Double click to split your units', 'Hold click to move camera', 'And protect your king :)']
  },
  game: {
    playing: false,
    dead: false,
    chat: {asdf: 'qwerty', msg: [], history: []},
    leaderboard: [],
    deadscreen: {
      spectate: false,
      name: 'name',
      killer: 'killer',
      playtime: 0,
      place: 0,
      kills: 0
    },
    scroll: {
      x: 0,
      y: 0
    }
  },
  god: {
    show: false,
    port: 7770,
    nameport: 'god',
    msg: []
  },
  state: {serverSocket: '', gameSocket: '', godSocket: ''},
  popup: {
    show: function (title, message) {
      this.title = title
      this.msg = message
      this.active = true
    },
    title: 'Message Title',
    msg: 'Mesage Body.',
    active: false
  }
}
