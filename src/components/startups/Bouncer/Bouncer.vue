<template>
    <page class="bouncer-page" actionBarHidden="true">
        <scroll-view v-dismissesIOSKeyboard>
            <stack-layout class="form">
                <label
                    :text="greetingText + '!'"
                    class="h1 text-center m-x-20 m-y-20"
                    verticalAlignment="bottom"
                    textWrap="true"
                />
                <icon-text-field
                    ref="usernameField"
                    v-model="username"
                    class="input m-t-20 m-x-20"
                    :hint="$t('username')"
                    returnKeyType="done"
                    autocapitalizationType="none"
                    autocorrect="false"
                    keyboardType="email"
                    icon=""
                />
                <icon-text-field
                    ref="passwordField"
                    v-model="password"
                    class="input m-y-10 m-x-20"
                    :hint="$t('password')"
                    returnKeyType="go"
                    secure="true"
                    icon=""
                    @returnPress="returnPressPasswordField"
                />
                <label
                    height="20"
                    :text="error ? $t(error) : ''"
                    class="m-t-10 m-x-30 text-error"
                />
                <button class="btn btn-primary m-t-20 m-x-20"
                        :class="{ 'soft-blink': busy }"
                        :text="!busy
                            ? $t('log_in')
                            : $t('connecting')"
                        :isEnabled="readyToStart && !busy"
                        @tap="connect()"
                />
            </stack-layout>
        </scroll-view>
    </page>
</template>

<script>
import Logger from '@/libs/Logger';
import getBncLogin from '@mobile/libs/BncLogin';

const log = Logger.namespace('Bouncer');

export default {
    data() {
        return {
            username: '',
            password: '',
            error: '',
            busy: false,
            loadingStatus: '',
        };
    },
    computed: {
        readyToStart() {
            return !!this.username && !!this.password;
        },
        greetingText() {
            let greeting = this.$state.settings.startupOptions.greetingText;
            return typeof greeting === 'string'
                ? greeting
                : this.$t('start_greeting');
        },
        buttonText: function buttonText() {
            let greeting = this.$state.settings.startupOptions.buttonText;
            return typeof greeting === 'string'
                ? greeting
                : this.$t('start_button');
        },
    },
    methods: {
        returnPressPasswordField(event) {
            if (this.readyToStart) {
                event.object.dismissSoftInput();
                this.connect();
            }
        },
        async connect() {
            const bncLogin = getBncLogin();
            this.error = '';
            this.busy = true;
            this.loadingStatus = this.$t('logging_in');

            bncLogin
                .login(this.username, this.password)
                .then(() => {
                    log('logged in!');
                    this.busy = false;
                    this.loadingStatus = '';
                    this.$modal.close('done');
                })
                .catch((error) => {
                    log.error(error);
                    this.error = error;
                    this.busy = false;
                    this.loadingStatus = '';
                });
        },
    },
};
</script>

<style lang="scss">
.bouncer-page {
    font-size: 16;
    line-height: 16;
}
.bouncer-page .form {
    vertical-align: center;
    background-color: transparent;
}
</style>
