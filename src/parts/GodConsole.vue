<template>
  <div id="godconsole">
    asdf
  </div>
</template>

<script>
  import GODS from '../modules/GodSocket'
  console.log(GODS.dummy)

  export default {
    props: ['god']
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  /* SASS imports */
  @import "../sass/variables";
  @import "../sass/mixins";

  #godconsole {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30000;
    background-color: rgba(255,255,255,0.2);
    font-size: 2.4vh;
  }

</style>
