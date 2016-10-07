<template>
  <div id="chat">
    <div class="output" id="chat_output">
      <div class="message history" v-show="showhistory" v-for="msg in chat.history">
        {{msg}}
      </div>
      <div class="message" v-for="msg in chat.msg">
        {{msg}}
      </div>
    </div>
    <div class="input">
      <input v-model="chattext" placeholder="[Enter] to send chat" type="text" v-on:keyup.enter="sendChat()" />
      <button class="historybutton" v-on:click="showhistory=!showhistory"></button>
    </div>
  </div>
</template>

<script>
  import GS from '../../modules/GameSocket'

  export default {
    props: ['chat'],
    data () {
      return {
        chattext: '',
        showhistory: false,
        msg: this.chat.msg
      }
    },
    methods: {
      sendChat: function () {
        if (this.chattext === '') return false
        GS.sendObj({m: 'chat', message: this.chattext})
        this.chattext = ''
      }
    },
    watch: {
      msg: function (val) {
        setTimeout(() => {
          window.document.getElementById('chat_output').scrollTop += 1000000
        }, 30)
      },
      showhistory: function (val) {
        setTimeout(() => {
          window.document.getElementById('chat_output').scrollTop += 1000000
        }, 10)
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
    z-index: 23000;
    width: 50vh;
    max-height: 100vh;
    overflow: hidden;
    background-color: black;
    opacity: 0.9;
    font-size: 2.4vh;

    .history {
      color: darken($base-alt, 40%);
    }

    .output {
      text-align: left;
      padding: 1vh 1vh 0;
      max-height: 94vh;
      overflow: auto;
    }
    .input {
      padding: 1vh;
      height: 6vh;
      background-color: black;
      white-space: nowrap;
      overflow: hidden;

      .historybutton {
        background-image: url('../../assets/history.png');
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        width: 9%;
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
