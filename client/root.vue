<template>
    <div>
        <top-menu v-if="$mq=='smallScreen'&&global.apiToken" />
        <sui-grid v-if="global.apiToken" >
            <sui-grid-row :columns="2">
                <sui-grid-column :width="2" v-if="$mq=='bigScreen'" >
                    <side-menu  />
                </sui-grid-column>
                <sui-grid-column 
                    :width="$mq | mq({
                        smallScreen: 16,
                        bigScreen: 14})">
                    <router-view />
                </sui-grid-column>
            </sui-grid-row>
        </sui-grid>
        <router-view v-else />

        
    </div>
</template>

<script>
const shared = require('./globalState');
const util = require('./util');
const topMenu = require('./menu/top.vue');
const bottomMenu = require('./menu/bottom.vue');
const sideMenu = require('./menu/side.vue');

module.exports = {
    data: () => ({ 
        global: shared.state
    }),
    methods:{
        authenticateUser: function() {
            util.fetch.call(this, '/api/auth/status/v1')
            .then(result => { this.global.passwordSet = result.ok; });

            util.fetch.call(this, '/api/onboard/status/v1')
            .then(result => { 
                this.global.onboardStatus = result.theJson.status;
                if (this.global.onboardStatus !== 'complete') {
                    this.$router.push({ name: 'welcome' });
                }
            });

            if (!this.global.apiToken) {
                this.$router.push({ name: 'loginTag', query: { forwardTo: this.$router.path }});
                return;
            }
        }
    },
    components: {
        'top-menu': topMenu,
        'bottom-menu': bottomMenu,
        'side-menu': sideMenu
    },
    computed: {
        globalApiToken: function() { return this.global.apiToken; },
    },
    watch: {
        globalApiToken: function (next, prev) {
            if (!next && prev) {
                console.log('reauthenticating for', this.$route.path);
                this.$router.push({ name: 'loginTag', query: { forwardTo: this.$route.path }});
            }
        }
    },
    mounted: function() {
        this.authenticateUser();
    }
}
</script>