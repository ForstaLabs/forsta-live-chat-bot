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
                <img src="http://localhost:4096/static/images/forsta-logo.svg" height="50px" width="50px"/>
                Bot Settings
            </h2>
        </sui-segment>

        <sui-segment>
            <h3>
                In office hours
            </h3>
            <p>When the bot recieves messages outside these hours it 
                will respond with the message you specify.</p>
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

module.exports = {
    mounted: function() {
        this.loadData();
    },
    methods: {
        checkForChanges: function() {
            if(this.changesMade) return;
            if(JSON.stringify(this.businessInfoData) !== this.businessInfoDataOriginal){
                this.changesMade = true;
            }
        },
        loadData: function() {
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
        saveAndContinue: function() {
            this.saveData();
            this.nextRoute();
        },
        saveData: function() {
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
        }
    },
    beforeRouteLeave: function(to, from, next){ 
        if(this.changesMade){
            this.showingSaveChangesModal = true;
            this.nextRoute = next;
            next(false);
        }else{
            next();
        }
    },
    data: () => ({ 
        global: shared.state,
        businessInfoData: {},
        businessInfoDataOriginal: {},
        changesMade: false,
        showingSaveChangesModal: false,
        nextRoute: null,
        tags: [],
        tagsForDropdown: [],
        actions: [
            {
                text: 'Forward to Questions',
                value: 'Forward to Questions'
            },
            {
                text: 'Forward to Tag',
                value: 'Forward to Tag'
            }
        ]
    }),
}
</script>