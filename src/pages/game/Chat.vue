<template>
  <div id="chat">
    <div class="output">
      <div class="message history" v-show="chat.showhistory" v-for="msg in chat.history">
        {{msg}}
      </div>
      <div class="message" v-for="msg in chat.msg">
        {{msg}}
      </div>
    </div>
    <div class="input">
      <input v-model="chattext" placeholder="[Enter] to send chat" type="text" v-on:keyup.enter="sendChat()" />
      <button class="historybutton" v-on:click="chat.showhistory=!chat.showhistory"></button>
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
    width: 50vh;
    max-height: 100vh;
    overflow: auto;
    background-color: black;
    opacity: 0.9;
    font-size: 2.4vh;

    padding-bottom: 6vh; // for chat bar

    .history {
      color: darken($base-alt, 40%);
    }



    .output {
      text-align: left;
      padding: 1vh;
    }
    .input {
      padding: 1vh;
      position: fixed;
      bottom: 0;
      left: 0;
      height: 6vh;
      width: 50vh;


      .historybutton {
        background-image: url('../../assets/history.png');
        background-size: contain;
        background-position: center;
        width: 8%;
        height: 4vh;
        vertical-align: text-top;
        background-color: transparent;
        display: inline-block;
        border: none;
        cursor: pointer;

        &:hover {
          opacity: 0.8;
        }

        &:focus {
          outline: none;
        }
      }
      input[type="text"]{
        vertical-align: text-top;
        display: inline-block;
        width: 88%;
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
  }
</style>
