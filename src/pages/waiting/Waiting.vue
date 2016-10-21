<template>
  <div id="waiting">

    <div class="center">
      <div class="title">Waiting for players...</div>
      <div class="players">{{waiting.players}} out of {{waiting.maxplayers}}</div>
      <div class="timeout" v-show="waiting.players>=waiting.minplayers">Starting in {{seconds}}</div>
      <div class="timeoutplacholder" v-show="waiting.players<waiting.minplayers">({{waiting.minplayers}} players minimum)</div>
      <button class="cancel" v-on:click="cancel()">Cancel</button>

      <div class="tips">
        <div class="tiptitle">
          Tips from the worlds best Kingz.io player
        </div>
        <div class="actualtip" v-for="tip in waiting.tips">
          {{tip}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import SS from '../../modules/ServerSocket'

  export default {
    props: ['waiting'],
    data () {
      return {
        now: Date.now() // local version of name bound to the input box
      }
    },
    methods: {
      cancel: function () {
        SS.sendObj({m: 'canceljoin'})
      }
    },
    computed: {
      seconds: function () {
        let time = this.waiting.timeout - this.now
        time /= 1000 // convert from miliseconds to seconds
        let minutes = Math.floor(time / 60)
        let sec = Math.abs(Math.floor(time % 60))
        return (minutes < 0 ? minutes + 1 : minutes) + ':' + (sec < 10 ? '0' : '') + sec
      }
    },
    mounted: function () {
      // update waiting timer
      setInterval(() => { this.now = Date.now() }, 1000)
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  /* SASS imports */
  @import "../../sass/variables";
  @import "../../sass/mixins";

  #waiting {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    overflow: auto;
    text-align: center;

    .tips {
      padding: 2.5vh;
      margin-top: 4vh;
      background-color: darken($base, 15%);

      .tiptitle {
        font-size: 3vh;
        font-weight: bold;
        padding: 0 1vh 1vh;
      }

      .actualtip {
        font-size: 2.5vh;
        font-weight: normal;
      }
    }

    .center {
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
    }

    .title {
      font-size: 5vh;
      padding: 0 0 2.5vh;
    }

    .players, .timeout, .timeoutplacholder {
      font-size: 3vh;
      padding: 1.5vh 0;
    }

    .cancel {
      @include bigbutton(6vh);
      margin: 2vh auto 0;
      width: 30vh;
    }

  }

</style>
