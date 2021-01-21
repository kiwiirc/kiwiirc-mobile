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
                <kiwi-dropdown
                    v-if="bouncerList.length > 1"
                    class="input m-t-20 m-x-20"
                    :options="bouncerList"
                    nullItem="Select Provider"
                    icon=""
                    v-model="bouncer"
                    @select="bouncerSelect"
                />
                <text-field
                    v-if="bouncer === 'Custom'"
                    v-model="bouncerUri"
                    class="input m-t-10 m-x-20"
                    hint="Server hostname (host:+port)"
                    returnKeyType="done"
                    autocapitalizationType="none"
                    autocorrect="false"
                    keyboardType="email"
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
import * as Misc from '@/helpers/Misc';
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
            bouncer: '',
            bouncerUri: '',
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
        buttonText() {
            let greeting = this.$state.settings.startupOptions.buttonText;
            return typeof greeting === 'string'
                ? greeting
                : this.$t('start_button');
        },
        bouncerPresets() {
            let presets = this.$state.settings.presetBouncers || [];
            return presets.map((str) => Misc.parsePresetServer(str));
        },
        bouncerList() {
            return [
                ...this.bouncerPresets.map((preset) => preset.name),
                'Custom',
            ];
        },
    },
    created() {
        if (this.bouncerList.length > 1) {
            let preset = this.bouncerPresets[0];
            this.bouncer = preset.name;
            this.bouncerUri = preset.toUri();
        }
    },
    methods: {
        returnPressPasswordField(event) {
            if (this.readyToStart) {
                event.object.dismissSoftInput();
                this.connect();
            }
        },
        bouncerSelect(value) {
            if (!value || value === 'Custom') {
                this.bouncerUri = '';
                return;
            }

            let preset = this.bouncerPresets.find(
                (preset) => preset.name === value
            );

            this.bouncerUri = (preset) ?
                preset.toUri() :
                '';
        },
        async connect() {
            const bncLogin = getBncLogin();
            this.error = '';
            this.busy = true;
            this.loadingStatus = this.$t('logging_in');

            // This will be used within initialiser.js to change the
            // bouncer server, port, tls settings
            this.$state.setting('bouncerUri', this.bouncerUri);

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
