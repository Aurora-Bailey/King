<template>
  <div id="godconsole">
    <div class="godout" id="godoutput">
      <div v-for="msg in god.msg">
        {{msg}}
      </div>
    </div>
    <div class="godin">
      <input v-model="textinput" type="text" v-on:keyup.enter="sendInput()" v-on:keyup.up="cycleHistory(-1)" v-on:keyup.down="cycleHistory(1)"/>
    </div>
  </div>
</template>

<script>
  import GODS from '../modules/GodSocket'
  console.log(GODS.dummy)

  export default {
    props: ['god'],
    data () {
      return {
        textinput: '',
        msg: this.god.msg,
        history: [],
        histPoint: 0
      }
    },
    methods: {
      sendInput: function () {
        if (this.textinput === '') return false
        GODS.sendObj({m: 'input', msg: this.textinput})
        this.history.push(this.textinput)
        this.histPoint = this.history.length
        this.textinput = ''
      },
      cycleHistory: function (ind) {
        this.histPoint += ind
        if (typeof this.history[this.histPoint] !== 'undefined') {
          this.textinput = this.history[this.histPoint]
        } else {
          this.textinput = ''
          this.histPoint = this.history.length
        }
      }
    },
    watch: {
      msg: function (val) {
        setTimeout(() => {
          window.document.getElementById('godoutput').scrollTop += 1000000
        }, 0)
      }
    }
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
    margin: auto;
    z-index: 40000;
    background-color: rgba(0,0,0,1);
    opacity: 0.9;
    font-size: 2vh;

    .godout {
      height: 94vh;
      overflow-x: hidden;
      overflow-y: auto;
      padding: 1vh 1vh 0;
    }
    .godin {
      height: 6vh;
      padding: 1vh;

      input[type="text"]{
        vertical-align: text-top;
        display: inline-block;
        width: 100%;
        height: 4vh;
        font-size: 2vh;
        text-align: left;
        line-height: 4vh;
        padding: 0 1vh;
        color: #888;
        background-color: white;
        border: 0.2vh solid #888;
        box-shadow: 0 0.125em 0.5em 0 rgba(0,0,0,0.1);
        border-radius: 0.5vh;

        -webkit-transition: border-color ease-in-out .15s,-webkit-box-shadow ease-in-out .15s;
        -o-transition: border-color ease-in-out .15s,box-shadow ease-in-out .15s;
        transition: border-color ease-in-out .15s,box-shadow ease-in-out .15s;

        &:focus {
          outline: none;
          border-color: lighten($accent, 10%);
          box-shadow: 0 0 2vh 0 lighten($accent, 10%);
        }
      }
    }
  }

</style>
