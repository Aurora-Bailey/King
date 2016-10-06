<template xmlns:v-bind="http://www.w3.org/1999/xhtml" xmlns:v-on="http://www.w3.org/1999/xhtml">
  <div id="game">
    <chat :chat="game.chat"></chat>
    <deadscreen :deadscreen="game.deadscreen" v-show="game.dead && !game.deadscreen.spectate"></deadscreen>
    <div class="scrollhomebutton" v-on:click="scrollhome()"></div>
    <div class="togglecirclecells"
         v-bind:class="{circlecells: game.circlecells == true}"
         v-on:click="game.circlecells = !game.circlecells"></div>
    <div class="gamescroll"
         oncontextmenu="return false"
         v-on:mousedown.stop.prevent="startscroll" v-on:mousemove.stop.prevent="mousemove" v-on:mouseup.stop.prevent="endscroll"
         v-on:touchstart.stop.prevent="startscroll" v-on:touchmove.stop.prevent="mousemove" v-on:touchend.stop.prevent="endscroll">
      <div class="gamemap"
           v-bind:class="{circlecells: game.circlecells == true}"
           v-bind:style="{ marginLeft: game.scroll.x + 'px', marginTop: game.scroll.y + 'px' }">
        <div v-for="y in game.map" class="row">
          <div v-for="x in y" class="cell"
               v-on:mousedown="movestart(x.loc.x, x.loc.y)"
               v-on:touchstart="movestart(x.loc.x, x.loc.y)"
               v-bind:class="{solid: x.solid == 1, me: x.owner === game.myid}"
               v-bind:style="{ backgroundColor: x.color }">
            <div class="king" v-show="x.king"></div>
            <div class="units" v-show="x.units>0">{{x.units}}</div>
            <div class="name" v-show="x.owner !== -1 && x.owner !== game.myid">{{x.owner === -1 ? '':game.players[x.owner].name}}</div>

            <div class="movehelper" v-show="x.movehelp != 0">
              <div class="center"
                   v-on:mousedown.stop.prevent="movestart(x.loc.x, x.loc.y)"
                   v-on:touchstart.stop.prevent="movestart(x.loc.x, x.loc.y)">{{move.percent}}%</div>
              <div class="up"
                   v-on:mousedown.stop.prevent="movedirection(0)"
                   v-on:touchstart.stop.prevent="movedirection(0)"></div>
              <div class="left"
                   v-on:mousedown.stop.prevent="movedirection(3)"
                   v-on:touchstart.stop.prevent="movedirection(3)"></div>
              <div class="right"
                   v-on:mousedown.stop.prevent="movedirection(1)"
                   v-on:touchstart.stop.prevent="movedirection(1)"></div>
              <div class="down"
                   v-on:mousedown.stop.prevent="movedirection(2)"
                   v-on:touchstart.stop.prevent="movedirection(2)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
  import GS from '../../modules/GameSocket'
  import Chat from './Chat'
  import Deadscreen from './Deadscreen'

  export default {
    props: ['game'],
    components: {
      Chat,
      Deadscreen
    },
    data () {
      return {
        move: {
          inprogress: false,
          loc: {x: 0, y: 0},
          percent: 0,
          direction: 0
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
        if (this.game.map[y][x].owner === this.game.myid) {
          // if you click on different cell during move
          if (this.move.inprogress && this.move.loc.x !== x || this.move.inprogress && this.move.loc.y !== y) {
            this.cancelmove()
            return false
          }

          this.move.inprogress = true
          this.move.loc.x = x
          this.move.loc.y = y

          let state = this.game.map[y][x].movehelp + 1
          this.game.map[y][x].movehelp = state

          // 0 by default
          if (state === 1) this.move.percent = 100
          if (state === 2) this.move.percent = 50
          if (state === 3) this.cancelmove()
        } else {
          this.cancelmove()
        }
      },
      movedirection: function (d) {
        this.move.direction = d
        GS.sendObj({m: 'move', move: [this.move.loc.x, this.move.loc.y, this.move.percent, this.move.direction]})
        this.cancelmove()
      },
      cancelmove: function () {
        this.move.inprogress = false
        this.game.map[this.move.loc.y][this.move.loc.x].movehelp = 0
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
      top: 1vh;
      left: 1vh;
      z-index: 22000;
      height: 10vh;
      width: 10vh;
      font-size: 2vh;
      line-height: 10vh;
      text-align: center;
      background-image: url('../../assets/crown.png');
      background-size: contain;
      background-position: center;
      color: grey;
      border-radius: 2.5vh;
      border: 0.5vh solid black;
      cursor: pointer;
      background-color: $accent;
    }
    .togglecirclecells {
      display: none; // disable for now
      position: absolute;
      top: 13vh;
      left: 3.5vh;
      z-index: 22000;
      height: 5vh;
      width: 5vh;
      border-radius: 2.5vh;
      border: 0.5vh solid #ccc;
      cursor: pointer;
      background-color: white;

      &.circlecells {
        border-radius: 0;
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

      &.circlecells {
        .cell {
          border-radius: 25px;
          .movehelper {
            .up, .down, .left, .right, .center {
              border-radius: 25px
            }
          }
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
      background-color: white;
      overflow: visible;
      text-align: center;


      .name {
        width: 100px;
        height: 20px;
        line-height: 20px;
        position: absolute;
        top: -20px;
        left: -50px;
        right: -50px;
        z-index: 1020;
        margin: auto;
        background-color: black;
        color: white;
        display: none;
        pointer-events: none;
      }
      &:hover .name {
        display: block;
      }

      .movehelper {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        pointer-events: none;

        .up, .down, .left, .right, .center {
          width: 44px;
          height: 44px;
          line-height: 44px;// -3px*2 for border
          position: absolute;
          background-color: black;
          opacity: 0.5;
          pointer-events: auto;
          @include noselect;

          &:hover {
            opacity: 0.8;
          }
        }

        .up {
          top: -50px;
        }
        .left {
          left: -50px;
        }
        .right {
          right: -50px;
        }
        .down {
          bottom: -50px;
        }
        .center {
          opacity: 0.8;
        }
      }

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

      .king {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url('../../assets/crown.png');
        background-size: contain;
        background-position: center;
        pointer-events: none;
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
    }
  }

</style>
