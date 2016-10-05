<template>
  <div id="waiting">
    <div class="center">
      <div class="title">Waiting for players...</div>
      <div class="players">{{waiting.players}} out of {{waiting.maxplayers}}</div>
      <div class="timeout" v-show="waiting.players>=waiting.minplayers">Force start in {{seconds}}</div>
      <div class="timeoutplacholder" v-show="waiting.players<waiting.minplayers">(4 players minimum)</div>
      <button class="cancel" v-on:click="cancel()">Cancel</button>
      <div class="notice">
        For more players
        <br>
        Check back at the following times
        <br><br>
        6:00 AM/PM GMT
        <br>
        12:00 AM/PM GMT
        <br>
        Friday 8:00 PM GMT
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
        let sec = Math.floor(time % 60)
        if (sec < 10) {
          sec = '0' + sec
        }
        return minutes + ':' + sec
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

    .notice {
      margin: auto;
      font-size: 2vh;
      padding: 5vh;
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
      display: block;
      width: 30vh;
      border: none;
      font-size: 3vh;
      padding: 1.5vh 0;
      margin: 2vh auto 0;
      background-color: $accent;
      color: $accent-alt;
      cursor: pointer;
      box-shadow: 0 0.25em 0.5em 0 rgba(0,0,0,0.1);

      &:hover {
        background-color: lighten($accent, 10%);
        color: lighten($accent-alt, 10%);
      }
    }

  }

</style>
