export default {
  version: 'LKYHFOEIHLSKDJGEG',
  dev: {
    on: false,
    server: 'localhost',
    port: '7777'
  },
  server: 'ws.kingz.io',
  page: 'home',
  user: {name: ''},
  waiting: {players: 9000, timeout: Date.now(), inqueue: false, maxplayer: 100, minplayers: 1},
  game: {
    playing: false,
    dead: false,
    circlecells: false,
    chat: {asdf: 'qwerty', msg: []},
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
  state: {serverSocket: '', gameSocket: ''}
}
