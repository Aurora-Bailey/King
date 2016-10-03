<template>
  <div id="game">
    <div>
      <div v-for="y in game.map" class="row">
        <div v-for="x in y" class="cell" v-bind:class="{solid: x.solid == 1}" v-bind:style="{ backgroundColor: x.color }">
          <div class="units" v-show="x.units>0">{{x.units}}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  // import SS from '../../modules/ServerSocket'

  export default {
    props: ['game']
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
      border: 1px solid grey;

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
      }
    }
  }

</style>
