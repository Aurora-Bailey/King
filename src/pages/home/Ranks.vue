<template>
  <div id="ranks" v-on:click="ranks_closed=!ranks_closed" v-bind:class="{ranks_closed: ranks_closed}">
    <div class="trophy-background"></div>
    <div class="leaderboard">
      <div class="leaderboardtitle">{{typeof game !== 'undefined' ? game.name : ''}}</div>
      <div class="rankedplayer" v-for="(leader, index) in leaderboard">
        <span class="lead_name">#{{leader.rank}} {{leader.name}}</span>
        <span class="lead_points">★{{leader.points}}</span>
      </div>
    </div>
  </div>
</template>

<script>
  import SS from '../../modules/ServerSocket'

  export default {
    props: ['user', 'leaderboard', 'game'],
    data () {
      return {
        ranks_closed: true
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  /* SASS imports */
  @import "../../sass/variables";
  @import "../../sass/mixins";

  #ranks {
    background-color: black;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 300;
    overflow: hidden;
    text-align: center;
    width: 30vh;
    height: 100vh;
    margin: auto;
    font-size: 2vh;
    transition: all .5s ease;
    cursor: pointer;
    border: 0.3vh solid darken($base, 5%);
    border-radius: 0;

    .trophy-background {
      background-image: url("../../assets/trophy.png");
      background-repeat: no-repeat;
      background-size: contain;
      background-position: center;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0.2;
      transition: opacity .5s ease;
    }

    .leaderboard {
      text-align: left;
      padding: 2vh;
      opacity: 1;
      transition: opacity .5s ease;
      overflow-y: auto;

      .leaderboardtitle {
        font-size: 1.5em;
        font-weight: bold;
        padding-bottom: 1vh;
      }
      .rankedplayer {
        line-height: 2.4vh;
        height: 2.4vh;
      }
      .lead_name {
        float: left;
      }
      .lead_points {
        float: right;
      }
    }

    &.ranks_closed {
      top: 1vh;
      right: 1vh;
      width: 8vh;
      height: 8vh;
      font-size: 0;
      background-color: transparent;
      border-radius: 8vh;
      border: 0.3vh solid $base-alt;
      .leaderboard {
        opacity: 0;
      }
      .trophy-background {
        opacity: 1;
      }
    }
  }

</style>
