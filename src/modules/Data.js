export default {
  version: 'LKYHFOEIHLSKDJGEG', // this version is live as of 10/4/2015 11:32 PM
  dev: {
    on: window.location.hostname === 'localhost',
    server: 'localhost',
    port: '7777'
  },
  server: 'ws.kingz.io',
  page: 'home',
  user: {
    id: 0,
    name: '',
    lastlogin: 0,
    numplays: 0,
    points: 0,
    rank: 0,
    microversion: 'v1466',
    notes: [
      {title: 'Notice', text: 'For more players check back at the following times \n\n 6:00 AM/PM GMT \n 12:00 AM/PM GMT \n Friday 8:00 PM GMT'}
    ]
  },
  leaderboard: [],
  waiting: {
    players: 9000,
    timeout: Date.now(),
    inqueue: false,
    maxplayer: 100,
    minplayers: 1,
    tips: ['Double click to split', 'Hold click to move camera', 'And protect your king :)']
  },
  game: {
    playing: false,
    dead: false,
    circlecells: false,
    chat: {asdf: 'qwerty', msg: [], history: [], showhistory: false},
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
  state: {serverSocket: '', gameSocket: ''},
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
