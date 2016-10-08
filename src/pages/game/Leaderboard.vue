<template>
  <div id="leaderboard">
    <div class="leadtitle">Leaderboard</div>
    <div class="ranks" v-bind:style="{color: leader.color}" v-for="(leader, index) in leaderboard">
      #{{parseInt(index) + 1}} {{leader.name}} - {{leader.units}} | {{leader.blocks}}
    </div>
  </div>
</template>

<script>
  export default {
    props: ['leaderboard']
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  /* SASS imports */
  @import "../../sass/variables";
  @import "../../sass/mixins";

  #leaderboard {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 22000;
    width: 28vh;
    max-height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: black;
    opacity: 0.9;
    text-align: center;
    padding: 1vh 1vh 4vh;
    white-space: nowrap;

    .leadtitle {
      font-size: 3vh;
      font-weight: bold;
      padding: 1vh;
    }

    .ranks {
      font-size: 2vh;
      padding: 0 1vh;
    }
  }
</style>
