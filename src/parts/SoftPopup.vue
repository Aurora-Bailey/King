<template>
  <div id="popup">
    <div class="msgbox">
      <div class="title">{{popup.title}}</div>
      <div class="text">{{popup.msg}}</div>
      <button class="confirm" v-on:click="popup.active=!popup.active">OK</button>
    </div>
  </div>
</template>

<script>
  export default {
    props: ['popup']
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  /* SASS imports */
  @import "../sass/variables";
  @import "../sass/mixins";

  #popup {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30000;
    background-color: rgba(255,255,255,0.2);
    font-size: 2.4vh;

    .msgbox {
      position: absolute;
      top: 15vh;
      left: 0;
      right: 0;
      margin: auto;
      width: 50vh;
      background-color: $base-alt;
      color: $base;
      text-align: center;
      box-shadow: 0 0 8vh 0 rgba(0,0,0,0.3);
      padding: 4vh;
    }

    .title {
      font-size: 2.5vh;
      padding: 1vh;
      font-weight: bold;
    }
    .text {
      white-space: pre-wrap;
      font-size: 2vh;
      padding: 1vh;
      color: lighten($base, 20%);
    }
    .confirm {
      width: 30%;
      margin: 2vh auto 0;
      display: block;
      border: none;
      font-size: 2vh;
      padding: 1vh 0;
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
