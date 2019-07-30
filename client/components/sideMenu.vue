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
    color:#fff;
}
.hover-white:hover{
    cursor: pointer;
    color:#fff;
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
    <sui-sidebar
        class="reactiveSidebar"
        style="background-color:#222"
        animation="slide out"
        direction="left"
        visible
        mq="bigScreen"
        width="very wide">

        <div style="padding:10px"></div>

        <span style="padding:10px">
            <img 
                class="logo" 
                src="/static/images/forsta-logo-invert.svg" 
                height="50px"
                width="50px"
                @click="questions()">
            <h3 class="header" @click="questions()">&nbsp;&nbsp;Forsta Live Chat</h3>
        </span>
        
        <sui-list 
            divided 
            relaxed 
            size="huge" style="padding:7px; margin-top:50px">
            <sui-list-item @click="questions()">
                <sui-list-icon 
                    class="hover-white"
                    name="comments" 
                    size="large" 
                    vertical-align="middle" 
                    style="color:white" />
                <sui-list-content>
                    <a>Questions</a>
                </sui-list-content>
            </sui-list-item>
            <sui-list-item @click="businessInfo()">
                <sui-list-icon 
                    class="hover-white"
                    name="clock" 
                    size="large" 
                    vertical-align="middle" 
                    style="color:white" />
                <sui-list-content>
                    <a>Business Info</a>
                </sui-list-content>
            </sui-list-item>
            <sui-list-item @click="messageHistory()">
                <sui-list-icon 
                    class="hover-white"
                    name="archive" 
                    size="large" 
                    vertical-align="middle" 
                    style="color:white" />
                <sui-list-content>
                    <a>Message History</a>
                </sui-list-content>
            </sui-list-item>
            <sui-list-item @click="users()">
                <sui-list-icon 
                    class="hover-white"  
                    name="user" 
                    size="large" 
                    vertical-align="middle" 
                    style="color:white" />
                <sui-list-content>
                    <a>Users</a>
                </sui-list-content>
            </sui-list-item>
            <sui-list-item @click="showingSignOutModal = true">
                <sui-list-content>
                    <a>&nbsp;&nbsp;Sign Out</a>
                </sui-list-content>
            </sui-list-item>
        </sui-list>
    </sui-sidebar>

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
                    @click="showingSignOutModal = false"
                    content="Cancel" />
                <sui-button 
                    floated="right" 
                    class="green" 
                    @click="logout()"
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
        businessInfo: function () {
            this.$router.push({ name: 'businessInfo' });
        },
        messageHistory: function () {
            this.$router.push({ name: 'messageHistory' });
        }
    }
}
</script>