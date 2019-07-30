<template>
    <div>
        <top-menu v-if="global.apiToken" />
        <sui-grid>
            <sui-grid-row :columns="1" centered>
                <sui-grid-column
                    :width="$mq | mq({
                        smallScreen: 16,
                        bigScreen: 7})">
                    <router-view />
                </sui-grid-column>
            </sui-grid-row>
        </sui-grid>
    </div>
</template>

<script>
const shared = require('./globalState');
const util = require('./util');
const topMenu = require('./components/topMenu.vue');
const sideMenu = require('./components/sideMenu.vue');

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