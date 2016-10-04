<template>
  <div id="ds">
    <div class="title">You have been taken over by {{deadscreen.killer}}!!!</div>
    <div class="time">Time alive: {{deadscreen.playtime}}</div>
    <div class="kills">Kills: {{deadscreen.kills}}</div>
    <div class="place">Finish place: {{deadscreen.place}}</div>
    <button class="spectate" v-on:click="deadscreen.spectate = true">Spectate</button>
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
    width: 70vh;
    margin: auto;
    padding: 5vh;
    background-color: black;
    opacity: 0.9;
    font-size: 2.4vh;

    top: 50%;
    transform: translateY(-50%);
  }

  .spectate, .leave {
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


</style>
