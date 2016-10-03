<template>
  <div id="app">
    <home :user="user" v-show="page=='home'"></home>
    <waiting :waiting="waiting" v-show="page=='waiting'"></waiting>
  </div>
</template>

<script>
  // Modules
  import Data from './modules/Data'

  // Pages
  import Home from './pages/home/Home'
  import Waiting from './pages/waiting/Waiting'

  export default {
    components: {
      Home,
      Waiting
    },
    data () {
      return Data
    }
  }
</script>

<style lang="scss">

  /* SASS imports*/
  @import "sass/variables";
  @import "sass/mixins";
  @import "sass/general";

  /* Main styles*/
  #app {
    background-color: $base;
    color: $base-alt;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    overflow: auto;
  }

</style>
