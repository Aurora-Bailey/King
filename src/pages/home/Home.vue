<template>
  <div id="home">
    <div class=sidebar>
      <div class="leaderboard">
        <div class="leaderboardtitle">Leaderboard</div>
        <div class="rankedplayer" v-for="(leader, index) in leaderboard">
          #{{leader.rank}}
          {{leader.name}}
        </div>
      </div>

      <div class="notice" v-for="note in user.notes">
        <div class="notice_title">{{note.title}}</div>
        <div class="notice_text">{{note.text}}</div>
      </div>
    </div>


    <div class="microversion">{{user.microversion}}</div>
    <div class="contain_width">
      <div class="logo">Kingz.io</div>
      <div class="rank">Rank #{{user.rank}}</div>
      <div class="enter_name"><input type="text" v-bind:placeholder="user.name" v-model="name" maxlength="15" v-on:blur="setName()" /></div>
      <button class="play" v-on:click="join()">Play!</button>
      <div class="instructions" v-show="false">instructions</div>
      <div class="footer" v-show="false">About | Help | Contact</div>
    </div>
  </div>
</template>

<script>
  import SS from '../../modules/ServerSocket'

  export default {
    props: ['user', 'leaderboard'],
    data () {
      return {
        name: '' // local version of name bound to the input box
      }
    },
    methods: {
      setName: function () {
        if (this.name !== '') {
          SS.sendObj({m: 'setname', name: this.name})
          this.name = ''
        }
      },
      join: function () {
        SS.sendObj({m: 'join'})
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  /* SASS imports */
  @import "../../sass/variables";
  @import "../../sass/mixins";

  @import url(https://fonts.googleapis.com/css?family=Oleo+Script);

  #home {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    overflow: auto;
    text-align: center;

    .leaderboard {
      text-align: center;
      margin-bottom: 4vh;

      .leaderboardtitle {
        font-size: 3vh;
        font-weight: bold;
        padding: 1vh;
      }

      .rankedplayer {
        font-size: 2vh;
        padding: 0 1vh;
      }
    }

    .microversion {
      position: absolute;
      bottom: 1vh;
      left: 1vh;
      font-size: 2vh;
      color: darken($base, 10%)
    }

    .sidebar {
      width: 30vh;
      height: 100vh;
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 150;
      overflow: auto;
      padding: 1vh;
      opacity: 0.8;

      @media screen and (orientation: portrait) {
        width: 100vw;
        height: 35vh;
        top: auto;
        bottom: 0vh;
        left: 0;
        right: 0;
        white-space: nowrap;
        .notice, .leaderboard {
          white-space: normal;
          vertical-align: text-top;
          display: inline-block;
          width: 30vh;
          margin: 0 2vh;
        }
      }
    }

    .notice {
      text-align: center;
      margin-bottom: 2vh;
      padding: 2vh;
      background-color: darken($base, 15%);
      box-shadow: 0 0.25em 0.5em 0 rgba(0,0,0,0.1);

      .notice_title {
        font-size: 2.5vh;
        padding: 1vh;
      }
      .notice_text {
        white-space: pre-wrap;
        font-size: 1.8vh;
        padding: 1vh;
      }
    }

    .logo {
      font-size: 12vh;
      padding: 6vh 0;

      font-family: 'Oleo Script', cursive;
      color: $primary;
    }

    .rank {
      font-size: 3vh;
      padding: 1.5vh 0;
      text-align: left;
    }

    .enter_name {
      padding:2vh 0;

      input[type="text"]{
        @include biginput(8vh);
      }
    }


    .play {
      @include bigbutton(8vh);
    }

    .instructions {
      font-size: 2vh;
      padding: 1vh 0;
    }

    .footer {
      font-size: 2vh;
      padding: 1vh 0;
      position: absolute;
      bottom: 0;
      right: 0;
      left: 0;
      z-index: 110;
    }

    .contain_width {
      width: 50vh;
      margin: auto;
      position: relative;
      z-index: 120;
    }
  }

</style>
