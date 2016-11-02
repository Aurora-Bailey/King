<template xmlns:v-bind="http://www.w3.org/1999/xhtml" xmlns:v-on="http://www.w3.org/1999/xhtml">
  <div id="game">
    <audio id="game_ready_sound" src="/static/sound/ready.mp3"></audio>
    <audio id="game_message_sound" src="/static/sound/message.mp3"></audio>
    <chat :chat="game.chat"></chat>
    <leaderboard :leaderboard="game.leaderboard"></leaderboard>
    <deadscreen :deadscreen="game.deadscreen" v-show="game.dead && !game.deadscreen.spectate"></deadscreen>
    <div class="scrollhomebutton" v-on:click="scrollhome()"
         v-bind:style="{ backgroundColor: typeof game.players === 'undefined' || typeof game.myid === 'undefined' || typeof game.players[game.myid] === 'undefined' ? 'white' : 'hsl(' + game.players[game.myid].color + ',100%, 50%)' }"></div>
    <div class="graphics_toggle"
         v-bind:class="{on: graphics_hq}"
         v-on:click="graphics_hq = !graphics_hq"><span class="hq">HQ</span><span class="lq">LQ</span>
    </div><div class="audio_toggle"
         v-bind:class="{mute: audio_level === 0, low: audio_level === 1, full: audio_level === 2}"
         v-on:click="audio_level = (audio_level + 1) % 3"></div>
    <div class="gamescroll"
         oncontextmenu="return false"
         v-on:mousedown.stop.prevent="startscroll" v-on:mousemove.stop.prevent="mousemove" v-on:mouseup.stop.prevent="endscroll"
         v-on:touchstart.stop.prevent="startscroll" v-on:touchmove.stop.prevent="mousemove" v-on:touchend.stop.prevent="endscroll">
      <div class="gamemap" v-bind:style="{ marginLeft: game.scroll.x + 'px', marginTop: game.scroll.y + 'px' }" v-bind:class="{hq_textures: graphics_hq}">
        <div v-for="y in game.map" class="row">
          <div v-for="x in y" class="cell"
               v-on:mousemove="quickmove($event, x.loc.x, x.loc.y)"
               v-on:touchmove="quickmove($event, x.loc.x, x.loc.y)"
               v-on:mouseup="quickmoveoff"
               v-on:touchend="quickmoveoff"
               v-on:mousedown="movestart($event, x.loc.x, x.loc.y)"
               v-on:touchstart="movestart($event, x.loc.x, x.loc.y)"
               v-bind:class="{player: x.owner >= 0, solid: x.owner === -2, fog: x.owner === -3, city: x.owner === -4, empty: x.owner === -1, me: x.owner === game.myid, highlight: x.highlight, moving: x.moving}"
               v-bind:style="{ backgroundColor: x.color }">
            <div class="tint"></div>
            <div class="token" v-bind:class="{kingtoken: x.token === 1, citytoken: x.token === 4}"></div>
            <div class="units" v-show="x.units>0">{{move.percent > 0 && x.move_help > 0 ? move.percent + '%':x.units}}</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
  import GS from '../../modules/GameSocket'
  import Chat from './Chat'
  import Leaderboard from './Leaderboard'
  import Deadscreen from './Deadscreen'
  var Schema = require('../../../server/Schema')

  export default {
    props: ['game'],
    components: {
      Chat,
      Deadscreen,
      Leaderboard
    },
    data () {
      return {
        audio_level: 0,
        graphics_hq: true,
        move: {
          inprogress: false,
          loc: {x: 0, y: 0},
          percent: 0,
          to: {x: 0, y: 0}
        },
        quickmove_on: false,
        quickmove_used: false,
        scrolling: {
          mousedown: false,
          scroll: {x: 0, y: 0},
          from: {x: 0, y: 0},
          to: {x: 0, y: 0}
        }
      }
    },
    mounted: function () {
      if (typeof window.localStorage.audio !== 'undefined') this.audio_level = parseInt(window.localStorage.audio)
      else this.audio_level = 1
      this.changeaudio(this.audio_level)
    },
    watch: {
      audio_level: function (curr) {
        this.changeaudio(curr)
      }
    },
    methods: {
      changeaudio: function (curr) {
        let ready = document.getElementById('game_ready_sound')
        let message = document.getElementById('game_message_sound')
        if (curr === 0) {
          window.localStorage.audio = 0
          ready.volume = 0.1 // Don't turn off ready sound
          message.volume = 0
        } else if (curr === 1) {
          window.localStorage.audio = 1
          ready.volume = 0.1
          message.volume = 0.1
        } else if (curr === 2) {
          window.localStorage.audio = 2
          ready.volume = 0.8
          message.volume = 0.8
        }
      },
      mousemove: function (e) {
        if (typeof e.touches !== 'undefined') {
          if (typeof e.touches[1] !== 'undefined') {
            e = e.touches[1]
          } else {
            return false
          }
        }
        if (!this.scrolling.mousedown) return false
        this.scrolling.to.x = e.clientX
        this.scrolling.to.y = e.clientY

        let distx = this.scrolling.to.x - this.scrolling.from.x
        let disty = this.scrolling.to.y - this.scrolling.from.y

        this.game.scroll.x = this.scrolling.scroll.x + distx
        this.game.scroll.y = this.scrolling.scroll.y + disty
      },
      startscroll: function (e) {
        if (typeof e.touches !== 'undefined') {
          if (typeof e.touches[1] !== 'undefined') {
            e = e.touches[1]
          } else {
            return false
          }
        } else if (e.button !== 2) {
          return false
        }
        this.scrolling.mousedown = true

        this.scrolling.from.x = e.clientX
        this.scrolling.from.y = e.clientY

        this.scrolling.to.x = e.clientX
        this.scrolling.to.y = e.clientY

        this.scrolling.scroll.x = this.game.scroll.x
        this.scrolling.scroll.y = this.game.scroll.y
      },
      endscroll: function (e) {
        if (typeof e.touches !== 'undefined') {
          if (typeof e.touches[1] !== 'undefined') {
            e = e.touches[1]
          } else {
            return false
          }
        }
        this.scrolling.mousedown = false
      },
      scrollhome: function () {
        GS.shortObj({m: 'scrollhome'})
      },
      quickmove: function (e, x, y) {
        if (this.quickmove_on === false) return false
        if (this.game.map[y][x].move_help !== 0) return false
        if (this.game.map[y][x].highlight) {
          this.quickmove_used = true
          this.movestart(e, x, y)
          this.movestart(e, x, y)
        }
      },
      quickmoveoff: function (e) {
        if (typeof e.touches !== 'undefined') {
          if (typeof e.touches[1] === 'undefined') {
            e = e.touches[0]
          } else {
            return false
          }
        } else if (e.button !== 0) {
          return false
        }
        this.quickmove_on = false
        if (this.quickmove_used) {
          this.cancelmove()
          this.quickmove_used = false
        }
      },
      movestart: function (e, x, y) {
        this.quickmove_on = true
        if (typeof e.touches !== 'undefined') {
          if (typeof e.touches[1] === 'undefined') {
            e = e.touches[0]
          } else {
            return false
          }
        } else if (e.button !== 0) {
          return false
        }
        // if you click on different cell during move
        if (this.move.inprogress && this.move.loc.x !== x || this.move.inprogress && this.move.loc.y !== y) {
          // if its highlighted its probably a legal move
          if (this.game.map[y][x].highlight) {
            this.move.to.x = x
            this.move.to.y = y
            this.game.map[this.move.loc.y][this.move.loc.x].moving = true
            GS.sendBinary(Schema.pack('move', {
              m: 'move',
              move: [this.move.loc.x, this.move.loc.y, this.move.percent, this.move.to.x, this.move.to.y]
            }))
          }
          // move is over
          this.cancelmove()
          return false
        } else if (this.game.map[y][x].owner === this.game.myid) {
          // if you click on your own cell
          this.move.inprogress = true
          this.move.loc.x = x
          this.move.loc.y = y

          let state = this.game.map[y][x].move_help + 1
          this.game.map[y][x].move_help = state
          this.game.map[y][x].highlight = true

          // Highlight legal moves
          if (typeof this.game.map[y + 1] !== 'undefined' && typeof this.game.map[y + 1][x] !== 'undefined' && this.game.map[y + 1][x].owner !== -2) this.game.map[y + 1][x].highlight = true
          if (typeof this.game.map[y - 1] !== 'undefined' && typeof this.game.map[y - 1][x] !== 'undefined' && this.game.map[y - 1][x].owner !== -2) this.game.map[y - 1][x].highlight = true
          if (typeof this.game.map[y] !== 'undefined' && typeof this.game.map[y][x + 1] !== 'undefined' && this.game.map[y][x + 1].owner !== -2) this.game.map[y][x + 1].highlight = true
          if (typeof this.game.map[y] !== 'undefined' && typeof this.game.map[y][x - 1] !== 'undefined' && this.game.map[y][x - 1].owner !== -2) this.game.map[y][x - 1].highlight = true

          // 0 by default
          if (state === 1) this.move.percent = 100
          if (state === 2) this.move.percent = 50
          if (state === 3) this.cancelmove()
        }
      },
      cancelmove: function () {
        this.move.inprogress = false
        this.move.percent = 0
        let x = this.move.loc.x
        let y = this.move.loc.y
        this.game.map[y][x].move_help = 0

        // Remove all highlights
        for (let i = 0; i < this.game.map.length; i++) {
          for (let j = 0; j < this.game.map[i].length; j++) {
            this.game.map[i][j].highlight = false
          }
        }
        // end
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  /* SASS imports */
  @import "../../sass/variables";
  @import "../../sass/mixins";

  #game {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    overflow: hidden;
    text-align: left;
    background-color: $base;

    .scrollhomebutton {
      position: absolute;
      top: 15vh;
      left: 1vh;
      z-index: 22000;
      height: 6vh;
      width: 6vh;
      background-image: url('../../assets/crown.png');
      background-size: contain;
      background-position: center;
      border-radius: 1.25vh;
      border: 0.4vh solid black;
      cursor: pointer;
      background-color: $primary;
    }
    .graphics_toggle {
      position: absolute;
      top: 1vh;
      left: 1vh;
      z-index: 22000;
      height: 6vh;
      width: 6vh;
      border-radius: 1.25vh;
      border: 0.4vh solid black;
      cursor: pointer;
      background-color: $base-alt;
      color: $base;
      font-size: 2.5vh;
      font-weight: bold;
      line-height: 5.2vh; // acount for border
      text-align: center;

      .hq {
        display: none;
      }
      .lq {
        display: inline-block;
      }
      &.on {
        .hq {
          display: inline-block;
        }
        .lq {
          display: none;
        }
      }
    }
    .audio_toggle {
      position: absolute;
      top: 8vh;
      left: 1vh;
      z-index: 22000;
      height: 6vh;
      width: 6vh;
      border-radius: 1.25vh;
      border: 0.4vh solid black;
      cursor: pointer;
      background-color: $base-alt;
      color: $base;
      font-size: 2.5vh;
      font-weight: bold;
      line-height: 5.2vh; // acount for border
      text-align: center;
      background-size: contain;
      background-position: center;

      &.full {
        background-image: url('../../assets/audio_full_b.png');
      }
      &.low {
        background-image: url('../../assets/audio_low_b.png');
      }
      &.mute {
        background-image: url('../../assets/audio_mute_b.png');
      }
    }

    .gamescroll {
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }
    .gamemap {
      margin-top: 0;
      margin-left: 0;

      &.hq_textures {
        .fog {
          background-image: url('../../assets/cloud.jpg');
          background-size: cover;
        }
        .solid {
          background-image: url('../../assets/mountain.jpg');
          background-size: cover;
        }
        .empty {
          background-image: url('../../assets/map.jpg');
          background-size: cover;
        }
        .city {
          background-image: url('../../assets/cityback.jpg');
          background-size: cover;
        }
        .player {
          border: 2px solid grey;
        }

        .cell:not(.player){
          border: none;
        }
      }
    }

    .row {
      white-space: nowrap;
      height: 50px;
    }
    .cell {
      display: inline-block;
      width: 50px;
      height: 50px;
      white-space: nowrap;
      position: relative;
      border: 1px solid #ccc;
      overflow: visible;
      text-align: center;
      background-color: white; // default cell color

      &.solid {
        // style for solid blocks
      }

      &.fog {
        // style for fog
      }

      .units {
        opacity: 0.9;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 120;
        text-align: center;
        line-height: 50px;
        font-weight: bold;
        font-size: 18px;
        color: white;
        text-shadow:
          -1px -1px 0 #000,
          1px -1px 0 #000,
          -1px 1px 0 #000,
          1px 1px 0 #000;
        -webkit-text-stroke-width: 1px;
        -webkit-text-stroke-color: black;
        pointer-events: none;
        @include noselect;
      }

      .tint {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        opacity: 0.5;
      }

      .token {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }

      .kingtoken {
        display: block;
        background-image: url('../../assets/crown.png');
        background-size: contain;
        background-position: center;
      }
      .citytoken {
        display: block;
        background-image: url('../../assets/home.png');
        background-size: contain;
        background-position: center;
      }

      &.me {
        @keyframes example {
          0% {border-color: red;}
          16% {border-color: orange;}
          32% {border-color: yellow;}
          48% {border-color: lime;}
          64% {border-color: cyan;}
          80% {border-color: mediumpurple;}
          100% {border-color: red;}
        }
        border: 3px solid black;
        cursor: pointer;
        animation-name: example;
        animation-duration: 6s;
        animation-iteration-count: infinite;

        .kingtoken {
          // my king
        }
      }

      &.highlight {
        cursor: pointer;
        .tint {
          background-color: black;
        }
      }
      &.moving {
        .tint {
          background-color: black;
        }
      }
    }
  }

</style>
