<style>
.hover-grey:hover{
    background-color:#ddd;
    cursor: pointer;
}

.label {
  color: #555;
  margin-bottom: 3px;
  margin-top: 5px;
  font-weight: 750;
}
</style>

<template lang="html">
    <div class="ui container left aligned">

        <div class="ui basic segment">
            <h2 class="ui header">
                Message History
            </h2>
        </div>

        <!-- <sui-dropdown text="Sort By" v-if="messageHistory.length != 0">
            <sui-dropdown-menu>
            <sui-dropdown-item @click="sortByUser({descending: false})">User (A-Z)</sui-dropdown-item>
            <sui-dropdown-item @click="sortByUser({descending: true})">User (Z-A)</sui-dropdown-item>
            <sui-dropdown-item @click="sortByDate({descending: false})">Date (Newest)</sui-dropdown-item>
            <sui-dropdown-item @click="sortByDate({descending: true})">Date (Oldest)</sui-dropdown-item>
            </sui-dropdown-menu>
        </sui-dropdown> -->

        <!--  QUESTION EDIT TABLE -->
            <sui-table 
                style="overflow:auto;">
            <sui-table-header>
                <sui-table-row>
                    <sui-table-header-cell>
                        Sender
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Reciever
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
                    @click="selectMessage(message)"
                    style="max-height:800px; overflow-x:hidden; overflow-y:scroll"
                    v-for="message in messageHistory">
                    <sui-table-cell v-text="message.recipientLabels[0]"></sui-table-cell>
                    <sui-table-cell v-text="message.recipientLabels[1]"></sui-table-cell>
                </sui-table-row>
            </sui-table-body>
        </sui-table>

        <sui-segment v-if="selectedMessage">
            <div class="label">Thread Id</div>
            <div>{{selectedMessage.threadId}}</div>
            
            <div class="label">Message Id</div>
            <div>{{selectedMessage.messageId}}</div>

            <div class="label">Distribution</div>
            <div>{{selectedMessage.distribution.pretty}}</div>
            
            <div class="label">Time Received</div>
            <div>{{selectedMessage.receivedMoment.format('h:MM:SS MM/DD/YYYY')}}</div>
            
            <div class="label">Sender Label</div>
            <div>{{selectedMessage.senderLabel}}</div>
            
            <div class="label">Sender ID</div>
            <div>{{selectedMessage.senderId}}</div>

            <sui-segment>
                <div class="label">Payload</div>
                <div>{{selectedMessage.payload}}</div>
            </sui-segment>
        </sui-segment>
        <!--  /QUESTION EDIT TABLE -->

        <!-- <sui-button
            v-if="messageHistory.length != 0"
            color="black"
            @click="saveAllThreadsToCSV()">Save All Threads</sui-button>
        <sui-button
            v-if="selectedThread"
            color="blue"
            @click="saveCurrentThreadToCSV()">Save Selected Thread</sui-button> -->
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
        selectedMessage: null
    }),
    computed: {
        filters () {
            let filts = _.mapValues(this.$route.query, (v, k) => { 
                return { 
                    value: v, 
                    presentation: present(k, v)
                };
            });
            return filts;
        },
        queryString () {
            let q = Object.keys(this.filters).map(k => `${k}=${this.filters[k].value.split('|')[0]}`);
            return q.join('&').replace("'","");
        }
    },
    watch: {
        queryString (val) {
            this.getMessages();
        }
    },
    methods: {
        getMessages () {
            const q = this.queryString;
            util.fetch.call(this, '/api/messages/history/v1?' + q)
            .then(result => {
                this.messageHistory = result.theJson.messages;
                console.log(this.messageHistory)
                this.messageHistory.forEach(m => {
                    m.receivedMoment = moment(m.received);
                    m.receivedText = m.receivedMoment.format('llll');
                    if (m.recipientIds.length <= 5 && !(m.messageId in this.showDist)) {
                        this.$set(this.showDist, m.messageId, true);
                    }
                });
            });
        },
        sortByDate ({ descending }) {
            let sorted = Array.from(this.messageHistory);
            sorted.sort( (a,b) => {
                var dateA = a.receivedMoment;
                var dateB = b.receievedMoment;
                if (dateA < dateB) {
                    return descending ? 1 : -1;
                }
                if (dateA > dateB) {
                    return descending ? -1 : 1;
                }
            });
            this.messageHistory = sorted;
        },
        sortByUser ({ descending }) {
            let sorted = Array.from(this.messageHistory);
            sorted.sort( (a,b) =>{
                var nameA = a.senderLabel.toUpperCase();
                var nameB = b.senderLabel.toUpperCase();
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
        // saveAllThreadsToCSV () {
        //     let formattedHistory = [];
        //     const threadTableHeader = ['Date Created', 'Time Created', 'User Name', 'User Email'];
        //     const messageTableHeader = ['Message', 'Action', 'Time'];
        //     this.messageHistory.forEach(thread => {
        //         formattedHistory.push(threadTableHeader);
        //         formattedHistory.push([thread.threadDate, thread.threadTime, thread.user.slug, thread.user.email]);
        //         formattedHistory.push(messageTableHeader);
        //         thread.messages.forEach(message => {
        //             formattedHistory.push([message.message, message.action, message.time]);                 
        //         });
        //     });
        //     let csv = csvStringify(formattedHistory, function(err, output){
        //         fileSaver.saveAs(new Blob([output]), `MessageHistory-${moment().format('MM/DD/YYYY')}.csv`);
        //     });
        // },
        // saveCurrentThreadToCSV () {
        //     if(!this.selectedThread) return;
        //     let formattedHistory = [];
        //     let thread = this.selectedThread;
        //     const threadTableHeader = ['Date Created', 'Time Created', 'User Name', 'User Email'];
        //     const messageTableHeader = ['Message', 'Action', 'Time'];
        //     formattedHistory.push(threadTableHeader);
        //     formattedHistory.push([thread.threadDate, thread.threadTime, thread.user.slug, thread.user.email]);
        //     formattedHistory.push(messageTableHeader);
        //     thread.messages.forEach(message => {
        //         formattedHistory.push([message.message, message.action, message.time]);                 
        //     });
        //     let csv = csvStringify(formattedHistory, function(err, output){
        //         fileSaver.saveAs(new Blob([output]), `MessageHistory-${moment().format('MM/DD/YYYY')}.csv`);
        //     });
        // },
        selectMessage: function(message) {
            console.log('selecting a message !');
            console.log(message)
            this.selectedMessage = message;
        }
    },
    mounted: function() {
        this.getMessages();
    }
}       
</script>