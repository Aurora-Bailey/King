<template xmlns:v-bind="http://www.w3.org/1999/xhtml" xmlns:v-on="http://www.w3.org/1999/xhtml">
  <div id="game">
    <chat :chat="game.chat"></chat>
    <leaderboard :leaderboard="game.leaderboard"></leaderboard>
    <deadscreen :deadscreen="game.deadscreen" v-show="game.dead && !game.deadscreen.spectate"></deadscreen>
    <div class="scrollhomebutton" v-on:click="scrollhome()"
         v-bind:style="{ backgroundColor: typeof game.players === 'undefined' || typeof game.myid === 'undefined' || typeof game.players[game.myid] === 'undefined' ? 'white' : 'hsl(' + game.players[game.myid].color + ',100%, 50%)' }"></div>
    <div class="gamescroll"
         v-on:mousedown.stop.prevent="startscroll" v-on:mousemove.stop.prevent="mousemove" v-on:mouseup.stop.prevent="endscroll"
         v-on:touchstart.stop.prevent="startscroll" v-on:touchmove.stop.prevent="mousemove" v-on:touchend.stop.prevent="endscroll">
      <div class="gamemap" v-bind:style="{ marginLeft: game.scroll.x + 'px', marginTop: game.scroll.y + 'px' }">
        <div v-for="y in game.map" class="row">
          <div v-for="x in y" class="cell"
               v-on:mousedown="movestart(x.loc.x, x.loc.y)"
               v-on:touchstart="movestart(x.loc.x, x.loc.y)"
               v-bind:class="{solid: x.owner === -2, me: x.owner === game.myid, highlight: x.highlight}"
               v-bind:style="{ backgroundColor: x.color }">
            <div class="token" v-bind:class="{king: x.token === 1}"></div>
            <div class="units" v-show="x.units>0">{{x.units}}</div>
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
        move: {
          inprogress: false,
          loc: {x: 0, y: 0},
          percent: 0,
          to: {x: 0, y: 0}
        },
        scrolling: {
          mousedown: false,
          scroll: {x: 0, y: 0},
          from: {x: 0, y: 0},
          to: {x: 0, y: 0}
        }
      }
    },
    methods: {
      mousemove: function (e) {
        if (typeof e.touches !== 'undefined') {
          e = e.touches[0]
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
          e = e.touches[0]
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
          e = e.touches[0]
        }
        this.scrolling.mousedown = false
      },
      scrollhome: function () {
        GS.shortObj({m: 'scrollhome'})
      },
      movestart: function (x, y) {
        // if you click on different cell during move
        if (this.move.inprogress && this.move.loc.x !== x || this.move.inprogress && this.move.loc.y !== y) {
          // if its highlighted its probably a legal move
          if (this.game.map[y][x].highlight) {
            this.move.to.x = x
            this.move.to.y = y
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
      bottom: 1vh;
      left: 51vh;
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

    .gamescroll {
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }
    .gamemap {
      margin-top: 0;
      margin-left: 0;
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
      background-color: white;
      overflow: visible;
      text-align: center;

      .units {
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

      .token {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }

      .king {
        display: block;
        background-image: url('../../assets/crown.png');
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

        .king {
          // my king
        }
      }

      &.highlight {
        opacity: 0.4;
        cursor: pointer;
      }
    }
  }

</style>
