<template>
  <div id="app">
    <transition name="slide-fade">
      <home :user="user" :gamelist="gamelist" :leaderboard="leaderboard" v-show="page=='home'"></home>
    </transition>
    <transition name="slide-fade">
      <waiting :waiting="waiting" v-show="page=='waiting'"></waiting>
    </transition>
    <transition name="slide-fade">
      <game :game="game" v-show="page=='game'"></game>
    </transition>

    <transition name="slide-fade">
      <god-console :god="god" v-show="god.show"></god-console>
    </transition>
    <transition name="slide-fade">
      <soft-popup :popup.sync="popup" v-show="popup.active"></soft-popup>
    </transition>
  </div>
</template>

<script>
  // Modules
  import Data from './modules/Data'

  // Pages
  import Home from './pages/home/Home'
  import Waiting from './pages/waiting/Waiting'
  import Game from './pages/game/Game'

  // Parts
  import GodConsole from './parts/GodConsole'
  import SoftPopup from './parts/SoftPopup'

  export default {
    components: {
      Home,
      Waiting,
      Game,
      GodConsole,
      SoftPopup
    },
    data () {
      return Data
    },
    mounted: function () {
      Data.page = 'home'
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
