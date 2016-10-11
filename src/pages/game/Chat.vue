<template>
  <div id="chat">
    <div class="output" id="chat_output">
      <div class="message history" v-bind:style="{color: msg.color}" v-show="showhistory" v-for="msg in chat.history">
        <span class="msgname">{{msg.name}}:</span> <span class="msgmsg">{{msg.msg}}</span>
      </div>
      <div class="message" v-bind:style="{color: msg.color}" v-for="msg in chat.msg">
        <span class="msgname">{{msg.name}}:</span> <span class="msgmsg">{{msg.msg}}</span>
      </div>
    </div>
    <div class="input">
      <input v-model="chattext" maxlength="250" placeholder="[Enter] to send chat" type="text" v-on:keyup.enter="sendChat()" />
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

    .output {
      text-align: left;
      padding: 1vh 1vh 0;
      max-height: 94vh;
      overflow: auto;

      .history {
        opacity: 0.6
      }

      .msgmsg {
        // message text style
      }

      .msgname {
        opacity: 0.7;
      }
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
        @include biginput(4vh);

        display: inline-block;
        vertical-align: text-top;
        width: 88%;
        text-align: left;
      }
    }
  }
</style>
