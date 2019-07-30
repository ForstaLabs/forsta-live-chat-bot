addEventListener('load', main);
function main() {
    const Vue = require('vue');
    const VueRouter = require('vue-router');
    const SuiVue = require('semantic-ui-vue');
    const VueMq = require('vue-mq');
    Vue.use(VueRouter);
    Vue.use(SuiVue.default);
    Vue.use(VueMq, {
        breakpoints: {
            smallScreen: 1350,
            bigScreen: Infinity
        }
    });

    const Root = require('./root.vue');
    const routes = [
        { path: '/welcome', name: 'welcome', component: require('./views/welcome.vue') },
        { path: '/auth/tag', name: 'loginTag', component: require('./views/loginTag.vue') },
        { path: '/auth/code', name: 'loginCode', component: require('./views/loginCode.vue') },
        { path: '/onboard/tag', name: 'onboardTag', component: require('./views/onboardTag.vue') },
        { path: '/onboard/auth/:type/:tag', name: 'onboardAuth', component: require('./views/onboardAuth.vue') },
        { path: '/users', name: 'users', component: require('./views/users.vue') },
        { path: '/questions', name: 'questions', component: require('./views/questions.vue') },
        { path: '/settings', name: 'settings', component: require('./views/settings.vue') },
        { path: '/messageHistory', name: 'messageHistory', component: require('./views/messageHistory.vue') },
        { path: '*', redirect: 'welcome' }
    ];

    const router = new VueRouter({
        mode: 'history',
        routes
    });

    new Vue({
        el: '#app',
        router,
        render: function (createElement) {
            return createElement(Root);
        }
    });
}