<template>
  <div id="ds">
    <div class="title">{{deadscreen.killer}} took your King!!!</div>
    <div class="time">Time alive: {{deadscreen.playtime}}</div>
    <div class="kills">Kills: {{deadscreen.kills}}</div>
    <div class="place">Finish place: {{deadscreen.place}}</div>
    <button class="spectate" v-on:click="deadscreen.spectate = true" v-show="false">Spectate</button>
    <button class="leave" v-on:click="leaveRoom()">Leave Room</button>
  </div>
</template>

<script>
  import GS from '../../modules/GameSocket'

  export default {
    props: ['deadscreen'],
    methods: {
      leaveRoom: function () {
        GS.close()
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  /* SASS imports */
  @import "../../sass/variables";
  @import "../../sass/mixins";

  #ds {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 22000;
    width: 50vh;
    margin: auto;
    padding: 5vh;
    background-color: black;
    opacity: 0.8;
    font-size: 2.4vh;
    pointer-events: none;

    top: 50%;
    -webkit-transform: translateY(-50%);
    transform: translateY(-50%);
  }

  .spectate, .leave {
    pointer-events: auto;
    @include bigbutton(6vh);
  }


</style>
