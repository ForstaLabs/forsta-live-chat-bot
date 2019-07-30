<style>
div [class*="pull left"] {
  float: left;
  margin-left: 0.25em;
}
div [class*="pull right"] {
  float: right;
  margin-right: 0.25em;
}
a{
    color:#ddd;
}
a:hover{
    color:#aaa;
}
.hover-gray:hover{
    cursor: pointer;
    color:#ddd;
}
.header{
    color:white;
    display:inline;
    vertical-align:middle;
    margin-left:12px;
    cursor:pointer;
}

</style>

<template>
    <div>
     <div class="ui inverted menu" style="z-index: 1;">
        <div class="ui container">
            <router-link :to="{name: 'questions'}" class="header item">
                <img class="logo" src="/static/images/forsta-logo-invert.svg"/>
                &nbsp;&nbsp;Forsta Live Chat
            </router-link>
            <div 
                class="header item float right" 
                style="padding:0px;"
                v-if="global.apiToken">
                <div class="ui simple dropdown item" style="margin-top:7px">
                    <i class="large user icon"></i>
                    <i class="dropdown icon"></i>
                    <div class="menu left">
                        <div class="item" @click="questions">
                            <i class="comment alternate outline icon tiny"></i> Questions 
                        </div>
                        <div class="item" @click="messageHistory">
                            <i class="archive icon tiny"></i> Message History 
                        </div>
                        <div class="item" @click="users">
                            <i class="user icon tiny"></i> Users
                        </div>
                        <div class="item" @click="settings">
                            <i class="clock icon tiny"></i> Settings 
                        </div>
                        <div class="item" @click="() => showingSignOutModal = true">
                            Sign Out
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
        <div>
            <sui-modal v-model="showingSignOutModal">
                <sui-modal-header>Sign Out</sui-modal-header>
                <sui-modal-content>
                    <sui-modal-description>
                        <sui-header>Are you sure you want to sign out?</sui-header>
                        <p>Any unsaved changes may be lost.</p>
                    </sui-modal-description>
                </sui-modal-content>
                <sui-modal-actions style="padding:10px">
                    <sui-button 
                        class="yellow" 
                        floated="left"
                        @click="() => showingSignOutModal = false"
                        content="Cancel" />
                    <sui-button 
                        floated="right" 
                        class="green" 
                        @click="logout"
                        content="Sign Out" />
                </sui-modal-actions>
            </sui-modal>
        </div>
    </div>
</template>

<script>
const shared = require('../globalState');

module.exports = {
    data: () => ({ 
        global: shared.state,
        loggedIn: false,
        showingSignOutModal: false
    }),
    methods: {
        logout: function () {
            this.global.apiToken = null;
        },
        questions: function () {
            this.$router.push({ name: 'questions' });
        },
        users: function () {
            this.$router.push({ name: 'users' });
        },
        settings: function () {
            this.$router.push({ name: 'settings' });
        },
        messageHistory: function () {
            this.$router.push({ name: 'messageHistory' });
        }
    }
}
</script>