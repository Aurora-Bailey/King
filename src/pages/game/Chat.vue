<template>
  <div id="chat">
    <div class="output">
      <div class="message" v-for="msg in chat.msg">
        {{msg}}
      </div>
    </div>
    <div class="input">
      <input v-model="chattext" placeholder="[Enter] to send chat" type="text" v-on:keyup.enter="sendChat()" />
    </div>
  </div>
</template>

<script>
  import GS from '../../modules/GameSocket'

  export default {
    props: ['chat'],
    data () {
      return {
        chattext: ''
      }
    },
    methods: {
      sendChat: function () {
        if (this.chattext === '') return false
        GS.sendObj({m: 'chat', message: this.chattext})
        this.chattext = ''
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  /* SASS imports */
  @import "../../sass/variables";
  @import "../../sass/mixins";

  #chat {
    position: absolute;
    left: 0;
    bottom: 0;
    z-index: 20000;
    width: 60vh;
    background-color: black;
    opacity: 0.9;
    font-size: 2.4vh;
    padding-bottom: 6vh; // padding for input at bottom of screen
  }

  .output {
    text-align: left;
    padding: 1vh;
  }
  .input {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1vh;

    input[type="text"]{
      display: block;
      width: 100%;
      height: 4vh;
      font-size: 2vh;
      text-align: center;
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

</style>
