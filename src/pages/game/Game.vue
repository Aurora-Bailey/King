<template xmlns:v-bind="http://www.w3.org/1999/xhtml" xmlns:v-on="http://www.w3.org/1999/xhtml">
  <div id="game">
    <div>
      <div v-for="y in game.map" class="row">
        <div v-for="x in y" class="cell"
             v-on:click="makemove(x.loc.x, x.loc.y)"
             v-bind:class="{solid: x.solid == 1, me: x.owner === game.myid}"
             v-bind:style="{ backgroundColor: x.color }">
          <div class="king" v-show="x.king"></div>
          <div class="units" v-show="x.units>0">{{x.units}}</div>

          <div class="movehelper" v-show="x.king">
            <div class="up">U</div>
            <div class="left">L</div>
            <div class="right">R</div>
            <div class="down">D</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  // import SS from '../../modules/ServerSocket'

  export default {
    props: ['game'],
    methods: {
      makemove: function (x, y) {
        window.alert(x + ' ' + y)
        if (this.game.map[y][x].owner === this.game.myid) {
          window.alert('You own this')
        }
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
    overflow: auto;
    text-align: center;
    background-color: $base;

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
      overflow: show;

      .movehelper {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        background-color: black;
        opacity: 0.5;

        .up, .down, .left, .right {
          width: 100%;
          height: 100%;
          position: absolute;
          background-color: black;
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
      }

      .units {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
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
        background-image: url('http://i.imgur.com/Y5maWdz.png');
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
        animation-name: example;
        animation-duration: 6s;
        animation-iteration-count: infinite;

        .king {
          background-image: url('http://i.imgur.com/a0otSA1.png');
        }
      }
    }
  }

</style>
