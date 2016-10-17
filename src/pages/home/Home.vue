<template>
  <div id="home">
    <div class=sidebar>
      <div class="leaderboard">
        <div class="leaderboardtitle">Leaderboard</div>
        <div class="rankedplayer" v-for="(leader, index) in leaderboard">
          <span class="lead_name">#{{leader.rank}} {{leader.name}}</span>
          <span class="lead_points">★ {{leader.points}} ★</span>
        </div>
      </div>

      <div class="notice" v-for="note in user.notes">
        <div class="notice_title">{{note.title}}</div>
        <div class="notice_text">{{note.text}}</div>
      </div>
    </div>

    <div class="twitter"><div class="twitter_bird"></div><div class="twitter_handle"><a target="_blank" href="https://twitter.com/Kingz_io">@Kingz_io</a> <a target="_blank" href="https://twitter.com/hashtag/KingzioGame">#KingzioGame</a></div></div>


    <div class="microversion">{{user.microversion}}</div>
    <div class="contain_width">
      <div class="logo">Kingz.io</div>
      <div class="rank"><span class="show_rank">Rank #{{user.rank}}</span><span class="show_points">Points ★ {{user.points}} ★</span></div>
      <div class="enter_name"><input type="text" v-bind:placeholder="user.name" v-model="name" maxlength="15" v-on:blur="setName()" /></div>
      <div class="play_wrapper">
        <button class="play" v-on:click="join(typeof gamelist[gamemode] === 'undefined' ? 'Offline':gamelist[gamemode].type)">
          {{typeof gamelist[gamemode] === 'undefined' ? 'Offline':gamelist[gamemode].name}}
          {{typeof gamelist[gamemode] !== 'undefined' && gamelist[gamemode].cur > 0 ? '' + gamelist[gamemode].cur + '/' + gamelist[gamemode].max +'':''}}
        </button><div class="play_arrow" v-on:click="showGameOptions=!showGameOptions"></div>

        <div class="game_options" v-show="showGameOptions">
          <div class="game_options_title">Games modes</div>
          <button v-for="(game,index) in gamelist" class="play" v-on:click="gamemode=index; showGameOptions=!showGameOptions">
            {{game.name}} {{game.cur > 0 ? '' + game.cur + '/' + game.max +'':''}}
          </button>
        </div>
      </div>
      <div class="instructions" v-show="false">instructions</div>
      <div class="footer" v-show="false">About | Help | Contact</div>
    </div>
  </div>
</template>

<script>
  import SS from '../../modules/ServerSocket'

  export default {
    props: ['user', 'leaderboard', 'gamelist'],
    data () {
      return {
        name: '', // local version of name bound to the input box
        showGameOptions: false,
        gamemode: 0
      }
    },
    methods: {
      setName: function () {
        if (this.name !== '') {
          SS.sendObj({m: 'setname', name: this.name})
          this.name = ''
        }
      },
      join: function (type) {
        SS.sendObj({m: 'join', type: type})
      }
    },
    watch: {
      gamemode: function (curr) {
        SS.sendObj({m: 'getranks', game: this.gamelist[curr].type})
      },
      gamelist: function (curr) {
        SS.sendObj({m: 'getranks', game: curr[0].type})
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  /* SASS imports */
  @import "../../sass/variables";
  @import "../../sass/mixins";

  #home {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    overflow: auto;
    text-align: center;

    .twitter {
      position: absolute;
      bottom: 1.5vh;
      left: 1.5vh;
      z-index: 180;

      .twitter_handle {
        display: inline-block;
        vertical-align: text-top;
        font-size: 2vh;
        line-height: 3vh;
      }
      .twitter_bird {
        vertical-align: text-top;
        display: inline-block;
        width: 2.5vh;
        height: 2.5vh;
        margin: 0.25vh 1.25vh 0.25vh 0.25vh;
        background-image: url('../../assets/twitter.png');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
      }
    }

    .leaderboard {
      text-align: center;
      margin-bottom: 4vh;

      .leaderboardtitle {
        font-size: 3vh;
        font-weight: bold;
        padding: 1vh;
      }

      .lead_name {
        display: inline-block;
      }
      .lead_points {
        display: none;
      }

      .rankedplayer {
        font-size: 2vh;
        line-height: 2.4vh;
        padding: 0 1vh;
        cursor: default;

        &:hover {

          .lead_name {
            display: none;
          }
          .lead_points {
            display: inline-block;
          }
        }
      }
    }

    .microversion {
      position: absolute;
      bottom: 1.5vh;
      right: 1.5vh;
      font-size: 2vh;
      color: lighten($base, 15%)
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
      padding: 4vh 0;

      font-family: 'Oleo Script', cursive;
      // color: $primary;
      letter-spacing: 0.03em;
    }

    .rank {
      font-size: 3vh;
      line-height: 3.5vh;
      padding: 1.5vh 0;
      text-align: left;
      cursor: default;

      .show_rank {
        display: inline-block;
      }
      .show_points {
        display: none;
      }

      &:hover {
        .show_rank {
          display: none;
        }
        .show_points {
          display: inline-block;
        }
      }
    }

    .enter_name {
      padding:2vh 0;

      input[type="text"]{
        @include biginput(8vh);
      }
    }

    .play_wrapper {
      position: relative;
      white-space: nowrap;
    }
    .play {
      @include bigbutton(8vh);

      display: inline-block;
      vertical-align: text-top;
      width: 82%;
    }
    .play_arrow {
      height: 8vh;
      width: 18%;
      background-color: darken($primary, 10%);
      color: $primary-alt;
      display: inline-block;
      margin: 2vh 0;
      vertical-align: text-top;
      cursor: pointer;
      background-image: url('../../assets/arrowdown.png');
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;

      &:hover {
        background-color: darken($primary, 20%);
        color: $primary-alt;
      }
    }
    .game_options {
      background-color: lighten($base, 10%);
      color: $base-alt;
      white-space: normal;

      .game_options_title {
        font-size: 4vh;
        padding: 2vh;
      }
      .play {
        width: 90%;
      }
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
      z-index: 200;
    }
  }

</style>
