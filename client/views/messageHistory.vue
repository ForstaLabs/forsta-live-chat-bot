<style>
.hover-grey:hover{
    background-color:#ddd;
}
</style>

<template lang="html">
    <div class="ui container left aligned">

        <div class="ui basic segment">
            <h2 class="ui header">
                Message History
            </h2>
        </div>

        <sui-dropdown text="Sort By" v-if="messageHistory.length != 0">
            <sui-dropdown-menu>
            <sui-dropdown-item @click="sortByUser(messageHistory, false)">User (A-Z)</sui-dropdown-item>
            <sui-dropdown-item @click="sortByUser(messageHistory, true)">User (Z-A)</sui-dropdown-item>
            <sui-dropdown-item @click="sortByDate(messageHistory, false)">Date (Newest)</sui-dropdown-item>
            <sui-dropdown-item @click="sortByDate(messageHistory, true)">Date (Oldest)</sui-dropdown-item>
            </sui-dropdown-menu>
        </sui-dropdown>

        <!--  QUESTION EDIT TABLE -->
            <sui-table 
                style="overflow:auto;">
            <sui-table-header>
                <sui-table-row>
                    <sui-table-header-cell>
                        User
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Operator
                    </sui-table-header-cell>
                </sui-table-row>
            </sui-table-header>
            <sui-table-body>
                <sui-table-row v-if="messageHistory.length == 0">
                    <sui-table-cell>
                        0 Threads in Message History
                    </sui-table-cell>
                </sui-table-row>
                <sui-table-row
                    class="hover-grey"
                    @click="selectThread(thread)"
                    v-for="message in messageHistory">
                    <sui-table-cell v-text="message.recipientLabels[0]"></sui-table-cell>
                    <sui-table-cell v-text="message.recipientLabels[1]"></sui-table-cell>
                </sui-table-row>
            </sui-table-body>
        </sui-table>

        <sui-table 
            class="ui left aligned table" 
            v-if="selectedThread">
            <sui-table-header>
                <sui-table-row>
                    <sui-table-header-cell>
                        Username
                    </sui-table-header-cell>
                     <sui-table-header-cell>
                        Message
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Action
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Time
                    </sui-table-header-cell>
                </sui-table-row>
            </sui-table-header>

            <sui-table-body 
                style="height:777px;overflow:auto;">
                <sui-table-row 
                    v-for="message in selectedThread.messages">
                    <sui-table-cell
                        v-text="message.user.slug">
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="message.message">
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="message.action">
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="message.time">
                    </sui-table-cell>
                </sui-table-row>
            </sui-table-body>

        </sui-table>
        <!--  /QUESTION EDIT TABLE -->

        <sui-button
            v-if="messageHistory.length != 0"
            color="black"
            @click="saveAllThreadsToCSV()">Save All Threads</sui-button>
        <sui-button
            v-if="selectedThread"
            color="blue"
            @click="saveCurrentThreadToCSV()">Save Selected Thread</sui-button>
    </div>
</template>

<script>
'use strict'
const csvStringify = require('csv-stringify');
const fileSaver = require('file-saver');
const _ = require('lodash');
const moment = require('moment');
const shared = require('../globalState')
const util = require('../util')

module.exports = {
    data: () => ({ 
        global: shared.state,
        backgroundInterval: null,
        enteredText: '',
        showDist: {},
        hideBody: {},
        fullCount: 0,
        offset: 0,
        ascending: 'no',
        messageHistory: [],
        selectedThread: null
    }),
    computed: {
        filters: function() {
            let filts = _.mapValues(this.$route.query, (v, k) => { 
                return { 
                    value: v, 
                    presentation: present(k, v)
                };
            });
            return filts;
        },
        queryString: function() {
            let q = Object.keys(this.filters).map(k => `${k}=${this.filters[k].value.split('|')[0]}`);
            return q.join('&').replace("'","");
        }
    },
    watch: {
        queryString: function(val) {
            this.getMessages();
        }
    },
    methods: {
        getMessages: function() {
            const q = this.queryString;
            util.fetch.call(this, '/api/messages/history/v1?' + q)
            .then(result => {
                this.messageHistory = result.theJson.messages;
                this.messageHistory.forEach(m => {
                    m.receivedMoment = moment(m.received);
                    m.receivedText = m.receivedMoment.format('llll');
                    if (m.recipientIds.length <= 5 && !(m.messageId in this.showDist)) {
                        this.$set(this.showDist, m.messageId, true);
                    }
                });
            });
        },
        sortByDate: function(messageHistory, descending) {
            let sorted = [];
            for(let threadId in messageHistory){
                sorted.push(messageHistory[threadId]);
            }
            sorted.sort( (a,b) => {
                var dateA = moment(a.threadDate, "MM/DD/YYYY");
                var dateB = moment(b.threadDate, "MM/DD/YYYY");
                if (dateA < dateB) {
                    return descending? 1: -1;
                }
                if (dateA > dateB) {
                    return descending? -1: 1;
                }
            });
            this.messageHistory = sorted;
        },
        sortByUser: function(messageHistory, descending) {
            let sorted = [];
            for(let threadId in messageHistory){
                sorted.push(messageHistory[threadId]);
            }
            sorted.sort( (a,b) =>{
                var nameA = a.user.slug.toUpperCase();
                var nameB = b.user.slug.toUpperCase();
                if (nameA < nameB) {
                    return descending? 1 : -1;
                }
                if (nameA > nameB) {
                    return descending? -1 : 1;
                }
                return 0;
            });
            this.messageHistory = sorted;
        },
        saveAllThreadsToCSV: function() {
            let formattedHistory = [];
            const threadTableHeader = ['Date Created', 'Time Created', 'User Name', 'User Email'];
            const messageTableHeader = ['Message', 'Action', 'Time'];
            this.messageHistory.forEach(thread => {
                formattedHistory.push(threadTableHeader);
                formattedHistory.push([thread.threadDate, thread.threadTime, thread.user.slug, thread.user.email]);
                formattedHistory.push(messageTableHeader);
                thread.messages.forEach(message => {
                    formattedHistory.push([message.message, message.action, message.time]);                 
                });
            });
            let csv = csvStringify(formattedHistory, function(err, output){
                fileSaver.saveAs(new Blob([output]), `MessageHistory-${moment().format('MM/DD/YYYY')}.csv`);
            });
        },
        saveCurrentThreadToCSV: function() {
            if(!this.selectedThread) return;
            let formattedHistory = [];
            let thread = this.selectedThread;
            const threadTableHeader = ['Date Created', 'Time Created', 'User Name', 'User Email'];
            const messageTableHeader = ['Message', 'Action', 'Time'];
            formattedHistory.push(threadTableHeader);
            formattedHistory.push([thread.threadDate, thread.threadTime, thread.user.slug, thread.user.email]);
            formattedHistory.push(messageTableHeader);
            thread.messages.forEach(message => {
                formattedHistory.push([message.message, message.action, message.time]);                 
            });
            let csv = csvStringify(formattedHistory, function(err, output){
                fileSaver.saveAs(new Blob([output]), `MessageHistory-${moment().format('MM/DD/YYYY')}.csv`);
            });
        },
        selectThread: function(thread) {
            this.selectedThread = thread;
        }
    },
    mounted: function() {
        this.getMessages();
    }
}       
</script>