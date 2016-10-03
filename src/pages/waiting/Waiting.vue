<template>
  <div id="waiting">
    <div class="contain_width">
      <div class="title">Waiting...</div>
      <div class="players">{{waiting.players}} out of {{waiting.maxplayers}} players</div>
      <div class="timeout">{{waiting.timeout}}</div>
      <button v-on:click="cancel()">Cancel</button>
    </div>
  </div>
</template>

<script>
  import SS from '../../modules/ServerSocket'

  export default {
    props: ['waiting'],
    methods: {
      cancel: function () {
        SS.sendObj({m: 'canceljoin'})
      }
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


    .contain_width {
      width: 50vh;
      margin: auto;
    }
  }

</style>
