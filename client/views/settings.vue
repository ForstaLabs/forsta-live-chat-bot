<style>
div [class*="pull left"] {
  float: left;
  margin-left: 0.25em;
}

div [class*="pull right"] {
  float: right;
   margin-right: 0.25em;
}

.flexbox {
    display: flex;
    flex: 1;
    margin-right:0.5em;
}

.label {
    color:#555;
    display: block;
    margin-bottom:3px;
    margin-top:5px;
    font-weight:750
}
</style>

<template lang="html">
    <div class="ui container left aligned">
        <sui-segment basic>
            <h2>
                Bot Settings
            </h2>
        </sui-segment>

        <sui-segment>
            <h3>
                In office hours
            </h3>
            <p>When the bot recieves messages outside these hours it 
                will respond with the message you specify.</p>
            <sui-divider style="margin-top:10px"/>
            <sui-grid>
                <sui-grid-row flex>
                    <sui-grid-column :width="8">
                        <span class="label">Open</span>
                        <sui-input 
                            format="HH:MM:AM"
                            v-model="businessInfoData.open"
                            type="time"
                            @input="checkForChanges()"/>
                    </sui-grid-column>
                    <sui-grid-column :width="8">
                        <span class="label">Close</span>
                        <sui-input 
                            format="HH:MM:AM"
                            v-model="businessInfoData.close"
                            type="time"
                            @input="checkForChanges()"/>   
                    </sui-grid-column>     
                    <sui-grid-column :width="16"> 
                        <span class="label">Message</span>                     
                        <sui-input 
                            :style="$mq | mq({
                                smallScreen: 'width:90%',
                                bigScreen: 'width:90%'})"
                            v-model="businessInfoData.outOfOfficeMessage"
                            @input="checkForChanges()"/>
                    </sui-grid-column>              
                </sui-grid-row>
                <sui-grid-row v-if="changesMade">
                    <sui-grid-column>
                        <sui-button 
                            class="ui button pull right" 
                            primary
                            @click="saveData()">
                            Save Changes
                        </sui-button>
                    </sui-grid-column>
                </sui-grid-row>
            </sui-grid>
        </sui-segment>

        <sui-segment>
            <div class="ui grid">
                <div class="ui nine wide column basic segment left aligned b1" 
                    :class="{loading: loading}" 
                    style="margin-top:-1em;">
                    <h3>
                        Authorized Users
                    </h3>
                    <p>These users will have permission to log in to this bot dashboard.</p>
                    <sui-divider style="margin-top:10px" />
                    <div class="ui list listgap">
                        <div v-for="a in admins" :key="a.id" class="item">
                            <a 
                                v-if="admins.length > 1" 
                                @click="removeAdmin(a.id)" 
                                data-tooltip="remove this authorized user">
                                <i class="large remove circle icon"></i>
                            </a> 
                            <span 
                                v-else 
                                data-tooltip="cannot remove last authorized user">
                                <i style="color: lightgray;" class="large remove circle icon"></i>
                            </span> 
                            {{a.label}}
                        </div>
                    </div>
                    <form class="ui large form enter-tag" @submit.prevent="addAdmin">
                        <div class="field" :class="{error:!!tagError}">
                            <div data-tooltip="add an authorized user" class="ui left icon action input">
                                <i class="at icon"></i>
                                <input type="text" v-model='tag' name="tag" placeholder="user:org" autocomplete="off">
                                <button class="ui icon button" :disabled="!tag" :class="{primary:!!tag}"><i class="plus icon"></i></button>
                            </div>
                        </div>
                    </form>
                    <div v-if="tagError" class="ui small error message">{{tagError}}</div>
                </div>
            </div>
        </sui-segment>

        <div>
            <sui-modal v-model="showingSaveChangesModal">
                <sui-modal-header>Continue without saving changes?</sui-modal-header>
                <sui-modal-content>
                    <sui-modal-description>
                        <p>Your changes have not been saved.</p>
                    </sui-modal-description>
                </sui-modal-content>
                <sui-modal-actions style="padding:10px">
                    <sui-button 
                        class="black" 
                        @click="showingSaveChangesModal = false"
                        content="Cancel" />
                    <sui-button 
                        class="gray"
                        @click="nextRoute()"
                        content="Don't Save & Continue" />
                    <sui-button 
                        class="blue" 
                        @click="saveAndContinue()"
                        content="Save & Continue" />
                </sui-modal-actions>
            </sui-modal>
        </div>
        
    </div>
</template>

<script>
'use strict'
const util = require('../util')
const shared = require('../globalState')
const REFRESH_POLL_RATE = 15000;

async function addAdmin() {
    this.loading = true;
    let result;
    try {
        result = await util.fetch.call(this, '/api/admins/v1', { method: 'post', body: { op: 'add', tag: this.tag }})
        this.loading = false;
    } catch (err) {
        console.error(err);
        this.loading = false;
        return false;
    }
    if (result.ok) {
        const { administrators } = result.theJson;
        this.admins = administrators;
        this.tag = '';
        this.tagError = '';
    } else {
        this.tagError = util.mergeErrors(result.theJson);
    }
}

async function removeAdmin(id) {
    this.loading = true;
    let result;
    try {
        result = await util.fetch.call(this, '/api/admins/v1', { method: 'post', body: { op: 'remove', id }})
        this.loading = false;
    } catch (err) {
        console.error(err);
        this.loading = false;
        return false;
    }
    if (result.ok) {
        const { administrators } = result.theJson;
        this.admins = administrators;
    } else {
        this.removeError = util.mergeErrors(result.theJson);
    }
}

module.exports = {
    mounted () {
        this.loadData();
        this.getAdmins();
        this.interval = setInterval(() => this.getAdmins(), REFRESH_POLL_RATE); 
    },
    methods: {
        checkForChanges () {
            if(this.changesMade) return;
            if(JSON.stringify(this.businessInfoData) !== this.businessInfoDataOriginal){
                this.changesMade = true;
            }
        },
        loadData () {
            util.fetch('/api/business-info/', {method:'get'})
            .then( res => {
                this.businessInfoData = res.theJson;
                this.businessInfoDataOriginal = JSON.stringify(res.theJson);
            });


            util.fetch.call(this, '/api/tags/', {method: 'get'})
            .then(result => {
                this.tags = result.theJson.tags;
                this.tags.forEach( (tag, idx) => {
                    this.tagsForDropdown.push({
                        text: tag.slug,
                        value: tag.id
                    });
                });
            });
        },
        saveAndContinue () {
            this.saveData();
            this.nextRoute();
        },
        saveData () {
            util.fetch('/api/business-info/', 
            {
                method:'post', 
                body:
                { 
                    businessInfoData: this.businessInfoData 
                }
            });
            this.businessInfoDataOriginal = JSON.stringify(this.businessInfoData);
            this.changesMade = false;
        },
        getAdmins () {
            util.fetch.call(this, '/api/admins/v1')
            .then(result => {
                if (result.ok) {
                    this.admins = result.theJson.administrators;
                }
            });
        },
        removeAdmin (id) {
            removeAdmin.call(this, id);
        },
        addAdmin () {
            addAdmin.call(this);
        }
    },
    beforeRouteLeave (to, from, next){ 
        if(this.changesMade){
            this.showingSaveChangesModal = true;
            this.nextRoute = next;
            next(false);
        }else{
            next();
        }
    },
    beforeDestroy () {
        clearInterval(this.interval);
    },
    data: () => ({ 
        global: shared.state,
        businessInfoData: {},
        businessInfoDataOriginal: {},
        changesMade: false,
        showingSaveChangesModal: false,
        nextRoute: null,
        global: shared.state,
        loading: false,
        interval: null,
        tag: '',
        tagError: '',
        removeError: '',
        admins: [],
    }),
}
</script>