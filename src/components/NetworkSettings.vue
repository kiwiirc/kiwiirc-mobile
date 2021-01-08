<template>
    <scroll-view
        v-dismissesIOSKeyboard
        class="m-t-10"
    >
        <stack-layout class="networksettings-general form ">
            <label
                class="form-section-header"
                :text="$t('settings_server_details')"
            />
            <label
                v-if="network.editable_name"
                class="label m-t-20 m-b-5 m-x-20"
                :text="$t('network_name')"
            />
            <text-field
                v-if="network.editable_name"
                v-model="tempNetworkName"
                class="input m-x-20 m-b-20"
                returnKeyType="done"
                keyboardType="url"
                autocapitalizationType="none"
                autocorrect="false"
            />
            <server-selector
                :connection="network.connection"
                :network-list="network_list"
                @presetSelected="onPresetSelected"
            />

            <label
                class="label m-t-20 m-b-5 m-x-20"
                :text="$t('settings_nickname')"
            />
            <icon-text-field
                ref="nicknameField"
                v-model="network.connection.nick"
                class="input m-x-20"
                :hint="$t('settings_nickname')"
                autocapitalizationType="none"
                autocorrect="false"
                keyboardType="email"
                returnKeyType="done"
                icon=""
            />

            <label
                class="label m-t-20 m-b-5 m-x-20"
                :text="$t('password')"
            />
            <icon-text-field
                ref="passwordField"
                v-model="network.password"
                class="input m-x-20"
                :hint="$t('password')"
                autocapitalizationType="none"
                autocorrect="false"
                returnKeyType="done"
                secure="true"
                icon=""
            />

            <button
                v-show="network.state !== 'connected'"
                class="btn btn-actiongo m-t-20 m-x-20"
                :class="{ 'soft-blink': network.state === 'connecting' }"
                :text="network.state === 'disconnected'
                    ? $t('network_connect')
                    : $t('connecting')"
                :isEnabled="network.state === 'disconnected'"
                @tap="connect()"
            />

            <grid-layout class="m-t-20">
                <label
                    class="form-section-header "
                    :text="$t('settings_advanced')"
                />
                <label
                    android:paddingTop="15"
                    class="statebrowser-network-chevron fas m-r-20 m-t-10 p-x-5 pull-right"
                    :text="!show_advanced ? '' : ''"
                    @tap="show_advanced = !show_advanced"
                />
            </grid-layout>

            <dock-layout
                v-show="show_advanced"
                class="p-x-20 p-t-15"
            >
                <switch
                    v-model="settingShowRaw"
                    dock="right"
                    class="switch"
                />
                <label
                    class="label"
                    :text="$t('settings_show_raw')"
                />
            </dock-layout>

            <label
                v-show="show_advanced"
                class="label m-t-20 m-b-5 m-x-20"
                :text="$t('username')"
            />
            <icon-text-field
                v-show="show_advanced"
                ref="serverPasswordField"
                v-model="network.username"
                class="input m-x-20"
                :hint="$t('username')"
                autocapitalizationType="none"
                autocorrect="false"
                returnKeyType="done"
                keyboardType="email"
                icon=""
            />

            <label
                v-show="show_advanced"
                class="label m-t-20 m-b-5 m-x-20"
                :text="$t('server_password')"
            />
            <icon-text-field
                v-show="show_advanced"
                ref="serverPasswordField"
                v-model="network.connection.password"
                class="input m-x-20"
                :hint="$t('password')"
                secure="true"
                autocapitalizationType="none"
                autocorrect="false"
                returnKeyType="done"
                icon=""
            />

            <label
                class="form-section-header m-t-20"
                :text="$t('settings_danger')"
            />

            <dock-layout class="p-x-20 p-y-10">
                <button
                    dock="right"
                    class="btn fas btn-danger btn-icon"
                    @tap="removeNetwork()"
                >
                    <formatted-string><span></span></formatted-string>
                </button>
                <label
                    class="label "
                    :text="$t('settings_remove')"
                />
            </dock-layout>

        </stack-layout>
    </scroll-view>
</template>

<script>
'kiwi public';

import { confirm } from '@nativescript/core/ui/dialogs';
import * as Misc from '@/helpers/Misc';
import ServerSelector from './ServerSelector';

// import { wrapAllFnsInObj } from '@/helpers/PerfUtils';

export default {
    components: {
        ServerSelector,
    },
    props: ['network', 'isNew'],
    data() {
        return {
            server_type: 'network',
            switch_tabs_on_connect: false,
            network_list: [],
            show_advanced: false,
            tempNetworkName: '',
        };
    },
    computed: {
        settingShowRaw: {
            get() {
                return this.network.setting('show_raw');
            },
            set(val) {
                return this.network.setting('show_raw', val);
            },
        },
    },
    watch: {
        'network.state'() {
            if (!this.switch_tabs_on_connect) {
                return;
            }

            if (this.network.state === 'connected') {
                this.switch_tabs_on_connect = false;
                this.$state.$emit('server.tab.show', 'messages');
            } else if (this.network.state_error) {
                this.switch_tabs_on_connect = false;
            }
        },
        'network.connection.nick'(nick) {
            this.network.connection.nick = this.network.connection.nick.replace(' ', '');
        },
        tempNetworkName(newName) {
            this.$nextTick(() => {
                const parsedValue = newName.replace(/[^a-z0-9_]/gi, '');
                if (newName !== parsedValue) {
                    this.tempNetworkName = parsedValue;
                }
                this.network.name = this.tempNetworkName || '';
            });
        },
    },
    created() {
        this.network_list = this.$state.setting('presetNetworks') || [];

        this.tempNetworkName = this.network.name;

        // wrapAllFnsInObj(this.network);
    },
    methods: {
        readableStateError(err) {
            return Misc.networkErrorMessage(err);
        },
        connect() {
            this.switch_tabs_on_connect = true;
            this.$state.$emit('network.connect', this.network);
        },
        removeNetwork() {
            /* eslint-disable no-restricted-globals, no-alert */
            confirm('Really remove this network? This cannot be undone!')
                .then((result) => {
                    if (result) {
                        this.$state.removeNetwork(this.network.id);
                        this.$navigateBack();
                    }
                });
        },
        onPresetSelected(newPreset) {
            // update the server name only if the user is creating a new network
            if (this.isNew && newPreset.name !== 'custom') {
                this.tempNetworkName = newPreset.name;
            }
        },
    },
};
</script>
