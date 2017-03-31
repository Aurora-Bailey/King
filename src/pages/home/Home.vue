<template>
  <div id="home">
    <ranks :user="user" :leaderboard="leaderboard" :game="gamelist[gamemode]"></ranks>

    <div class="social_media">
      <div class="fb-like" data-href="http://kingz.io" data-layout="button" data-action="like" data-size="small" data-show-faces="true" data-share="true"></div>
      <br><a href="https://twitter.com/kingz_io" class="twitter-follow-button" data-show-screen-name="false" data-show-count="false"></a> <a class="twitter-share-button" href="https://twitter.com/intent/tweet"></a>
      <br>
      <a href="https://www.reddit.com/r/Kingzio" target="_blank" class="button-reddit"><img class="icon-reddit" title="Reddit r/Kingzio" src="../../assets/reddit_icon.png"/></a>
      <a href="https://discord.gg/3CxDJu7" target="_blank" class="button-discord"><img class="icon-discord" title="Discord" src="../../assets/discord_icon.png"/></a>
    </div>

    <div class="contain_width">
      <div class="logo">Kingz.io</div>
      <div class="rank"><span class="show_rank">Rank #{{user.rank}}</span> <span class="show_points">Points ★{{user.points}}</span> <div class="about-rank">? <div class="about-rank-tooltip">You recieve or lose points based on the place that you take <br> at the end of a game and the relative points of your opponents. <br> (Multiplayer ELO rating system)</div></div></div>
      <div class="enter_name"><input type="text" v-bind:placeholder="user.name" v-model="name" maxlength="15" v-on:blur="setName()" v-on:keydown.enter="justBlur" /></div>
      <div class="play_wrapper">
        <button v-for="(game,index) in gamelist" v-bind:class="{selected: index === gamemode}" class="play" v-on:click="join(gamelist[index].type); gamemode = index">
          {{gamelist[index].name}}
          {{gamelist[index].cur > 0 ? '' + gamelist[index].cur + '/' + gamelist[index].max +'':''}}
        </button>
      </div>

    </div>
    <div class="footer-ads">
      <div id="chitikaAdBlock-0"></div>
      <!-- <iframe :src="ad" width="100%" height="100%" scrolling="no" border="0" marginwidth="0" style="border:none;" frameborder="0"></iframe> -->
    </div>
    <div class="footer" >
      <a href="//www.iubenda.com/privacy-policy/7946359" class="iubenda-embed" title="Privacy Policy">Privacy Policy</a>
      <a href="http://iogames.space" target="_blank" class="more_io_games">More IO Games</a>
      <div class="facebook_login" v-if="!user.facebook" v-on:click="facebookLogin()"><img src="../../assets/facebook.png" class="fb_icon" /><span class="fb_text">Login with Facebook</span></div>
      <div class="facebook_login" v-if="user.facebook" v-on:click="facebookLogout()"><img src="../../assets/facebook.png" class="fb_icon" /><span class="fb_text">Logout</span></div>
      <div class="microversion">{{user.microversion}}</div>
    </div>
  </div>
</template>

<script>
  import SS from '../../modules/ServerSocket'
  import Ranks from './Ranks'
  import Facebook from '../../modules/Facebook'

  export default {
    props: ['ad', 'user', 'leaderboard', 'gamelist'],
    components: {
      Ranks
    },
    data () {
      return {
        name: '', // local version of name bound to the input box
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
      },
      justBlur: function (event) {
        event.target.blur()
      },
      facebookLogin: function () {
        Facebook.login()
      },
      facebookToken: function () {
        Facebook.token()
      },
      facebookLogout: function () {
        Facebook.logout()
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
    overflow: hidden;
    text-align: center;

    .about-rank {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      vertical-align: middle;
      display: inline-block;
      background-color: $base-alt;
      color: $base;
      font-weight: bold;
      font-size: 1.8vh;
      line-height: 2.5vh;
      width: 2.5vh;
      height: 2.5vh;
      margin: .5vh;
      text-align: center;
      border-radius: 2vh;
      cursor: default;


      .about-rank-tooltip {
        display: none;
        position: absolute;
        top: 0;
        right: 4vh;
        background-color: $base-alt;
        color: $base;
        padding: 0.5vh 2vh;
        margin: auto;
        white-space: nowrap;
        -webkit-box-shadow: 0.5vh 0.5vh 0.5vh 0 rgba(0,0,0,0.75);
        -moz-box-shadow: 0.5vh 0.5vh 0.5vh 0 rgba(0,0,0,0.75);
        box-shadow: 0.5vh 0.5vh 0.5vh 0 rgba(0,0,0,0.75);

        &::after {
          content: " ";
          position: absolute;
          top: 50%;
          left: 100%; /* To the right of the tooltip */
          margin-top: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: transparent transparent transparent white;
        }
      }
      &:hover {
        .about-rank-tooltip {
          display: inline-block;
        }
      }


    }

    .social_media {
      position: absolute;
      top: 1vh;
      left: 1vh;
      text-align: left;
      z-index: 250;

      .button-reddit, .button-discord {
        display: inline-block;
        vertical-align: text-top;
        margin: 2px 1px;

        &:hover {
          opacity: 0.8;
        }
      }

      .fb-like {
        margin-bottom: 5px;
      }
    }

    .logo {
      font-size: 12vh;
      padding: 1vh 0;

      font-family: 'Oleo Script', cursive;
      // color: $primary;
      letter-spacing: 0.03em;
    }

    .rank {
      font-size: 3vh;
      line-height: 3.5vh;
      height: 3.5vh;
      padding: 0;
      text-align: left;
      cursor: default;
      position: relative;

      .show_rank {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
      }
      .show_points {
        position: absolute;
        top: 0;
        right: 4vh;
        bottom: 0;
      }
    }

    .enter_name {
      padding:1vh 0;

      input[type="text"]{
        @include biginput(8vh);
      }
    }

    .play_wrapper {
      position: relative;
    }
    .play {
      @include bigbutton(4.5vh);

      display: inline-block;
      vertical-align: text-top;
      width: 23vh;
      margin: 0.5vh;

      &.selected {
        background-color: darken($primary, 15%);
      }
    }

    .footer-ads {
      height: 50vh;
      // width: 100vw;
      width: 100%;
      margin: 1vh auto 0;
      overflow: hidden;
    }

    .more_io_games {
      @include bigbutton(20px);
      display: inline-block;
      width: 110px;
      text-align: center;
      margin: 0 5px;
      vertical-align: top;
    }

    .facebook_login {
      height: 20px;
      background-color: $facebook;
      color: white;
      display: inline-block;
      text-align: center;
      margin: 0 4px;
      padding: 2px 7px 2px 5px;
      line-height: 16px;
      font-size: 12px;
      font-weight: bold;
      vertical-align: top;
      border-radius: 2px;
      cursor: pointer;

      &:hover {
        background-color: darken($facebook, 5%)
      }

      .fb_icon {
        display: inline-block;
        vertical-align: top;
        width: 16px;
        height: 16px;
        margin-right: 7px;
        pointer-events: none;
      }

      .fb_text {
        display: inline-block;
        vertical-align: top;
        pointer-events: none;
      }
    }

    .microversion {
      float: right;
      font-size: 16px;
      line-height: 20px;
      color: $base;
    }

    .footer {
      font-size: 16px;
      padding: 5px;
      height: 30px;
      position: absolute;
      overflow: hidden;
      text-align: left;
      background-color: lighten($base, 5%);
      bottom: 0;
      right: 0;
      left: 0;
      z-index: 250;
    }

    .contain_width {
      width: 50vh;
      margin: auto;
      position: relative;
      z-index: 200;
    }
  }

</style>
