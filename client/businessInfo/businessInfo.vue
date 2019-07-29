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
</style>

<template lang="html">
    <div class="ui container left aligned">

        <div class="ui basic segment" style="padding-top:5%">
            <h2 class="ui header">
                Distribution Forwarding
            </h2>
        </div>

        <sui-divider style="margin-top:5px"/>

        <sui-grid dividend="vertically">            
            <sui-grid-row>
                <sui-grid-column :width="16"> 
                    <sui-label
                        color="teal"
                        pointing="right">Message</sui-label>                     
                    <sui-input 
                        :style="$mq | mq({
                            smallScreen: 'width:90%',
                            bigScreen: 'width:90%'})"
                        v-model="businessInfoData.forwardMessage"
                        @input="checkForChanges()"/>
                </sui-grid-column>  
            </sui-grid-row>
        </sui-grid>

        <div class="ui basic segment" style="padding-top:5%">
            <h2 class="ui header">
                After Hours
            </h2>
        </div>

        <sui-divider style="margin-top:5px"/>

        <sui-grid divided="vertically">
            <sui-grid-row>
                <sui-grid-column :width="16">
                    <sui-label 
                        color="teal"
                        pointing="right">Open</sui-label>
                    <sui-input 
                        format="HH:MM:AM"
                        v-model="businessInfoData.open"
                        type="time"
                        @input="checkForChanges()"/>
                    <sui-label
                        color="teal"
                        pointing="right">Close</sui-label>
                    <sui-input 
                        format="HH:MM:AM"
                        v-model="businessInfoData.close"
                        type="time"
                        @input="checkForChanges()"/>   
                </sui-grid-column>     
                <sui-grid-column :width="16"> 
                    <sui-label
                        color="teal"
                        pointing="right">Message</sui-label>                     
                    <sui-input 
                        :style="$mq | mq({
                            smallScreen: 'width:90%',
                            bigScreen: 'width:90%'})"
                        v-model="businessInfoData.outOfOfficeMessage"
                        @input="checkForChanges()"/>
                </sui-grid-column>              
            </sui-grid-row>
            <sui-grid-row>
                <sui-grid-column>
                    <sui-button 
                        class="ui button pull right" 
                        primary
                        v-if="changesMade"
                        @click="saveData()">
                        Save Changes
                    </sui-button>
                </sui-grid-column>
            </sui-grid-row>
        </sui-grid>

        <div>
            <sui-modal v-model="showingSaveChangesModal">
                <sui-modal-header>Save Changes</sui-modal-header>
                <sui-modal-content>
                    <sui-modal-description>
                        <sui-header>Continue without saving changes?</sui-header>
                        <p>Your changes have not been saved.</p>
                    </sui-modal-description>
                </sui-modal-content>
                <sui-modal-actions style="padding:10px">
                    <sui-button 
                        class="yellow" 
                        floated="left"
                        @click="showingSaveChangesModal = false"
                        content="Cancel" />
                    <sui-button 
                        class="red"
                        @click="nextRoute()"
                        content="Don't Save & Continue" />
                    <sui-button 
                        floated="right" 
                        class="green" 
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