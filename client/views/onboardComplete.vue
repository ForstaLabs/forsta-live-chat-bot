<style>
</style>

<template>
    <div class="ui main text container" style="margin-top: 80px;">
        <div class="ui container center aligned">
            <div class="ui basic segment huge">
                <h1>
                    <i class="circular icon add user"></i>
                    Create Bot User
                </h1>
                This bot will send and receive messages autonomously <br />
                as a <strong>new or existing</strong> Forsta user.
                <br /><br />
            </div>
            <div class="ui centered grid">
                <div class="ui nine wide column basic segment left aligned t0 b1">
                    <form v-on:submit.prevent="submit" class="ui huge form" :class="{loading: loading}">
                        <div class="field">
                            <label>Username</label>
                            <div class="ui left icon input">
                                <input 
                                    v-focus.lazy="true" 
                                    type="text" 
                                    name="username" 
                                    placeholder="username" 
                                    autocomplete="off" 
                                    v-model="username"
                                >
                                <i class="lock icon"></i>
                            </div>
                        </div>
                        <div class="field">
                            <label>Tag</label>
                            <div class="ui left icon input">
                                <input
                                    type="text"
                                    name="secret"
                                    placeholder="user.tag"
                                    autocomplete="off"
                                    v-model="tag">
                                <i class="lock icon"></i>
                            </div>
                        </div>
                        <button
                            v-if="!userExistsError" 
                            class="ui large primary submit button right floated" 
                            type="submit">
                            Submit
                        </button>
                        <sui-message size="small" negative v-if="error" :content="error" dismissable @dismiss="error=''"/>
                        <sui-message size="small" info v-if="userExistsError" :content="userExistsError" />
                        <button
                            v-if="userExistsError"
                            dismissable
                            @dismiss="userExistsError=''"
                            class="ui large primary button submit centered">
                            Use {{tag}} as the bot
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
util = require('../util');
shared = require('../globalState');
focus = require('vue-focus');

module.exports = {
    data: () => ({
        tag: "", 
        username: "", 
        loading: false,
        error: "",
        userExistsError: "",
        global: shared.state
    }),
    methods: {
        submit () {
            var value = this.secret;
            var otp = this.otp;
            this.loading = true;
            const ua = this.username.split(" ");
            const extra = ua.slice(2, ua.length).join(" ") || "";
            const options = { 
                method: 'POST', 
                body: {
                    tag_slug: this.tag, 
                    first_name: this.username.split(" ")[0],
                    last_name: (this.username.split(" ")[1] || "") + " " + extra,
                    is_existing_tag: !!this.userExistsError
                }
            };
            util.fetch.call(this, '/api/auth/atlasauth/complete/v1/', options)
            .then(result => {
                this.loading = false;
                if (result.ok) {
                    this.global.onboardStatus = 'complete';
                    this.$router.push({ name: 'questions' });
                    return false;
                } else {
                    if (result.theJson.user_already_exists) {
                        this.userExistsError = result.theJson.user_already_exists;
                        return false;
                    }
                    this.error = util.mergeErrors(result.theJson) || 'Internal error, please try again.';
                    return false;
                }
            })
            .catch(err => {
                this.error = util.mergeErrors(result.theJson) || 'Internal error, please try again.';
                this.loading = false;
            });
            return false;
        }
    },
    watch: {
        username() {
            this.userExistsError = "";
            const ua = this.username.split(" ");
            const first = ua[0].toLowerCase();
            const last = (ua[1] || "").toLowerCase();
            const extra = ua.slice(2, ua.length).join("") || "";
            this.tag = first + (last ? "." + last : "") + extra;
        },
    },
    directives: {
        focus: focus.focus
    }
}
</script>