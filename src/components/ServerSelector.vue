<template>
    <grid-layout columns="*, 70, 80" rows="60, auto, auto" class="server-selector">
        <kiwi-dropdown :options="dropdownOptions"
                       :item="name"
                       class="m-y-10 m-x-20"
                       colSpan="3"
                       marginLeft="20"
                       @select="selectedNetwork"
        />
        <label
            row="1"
            col="0"
            class="label m-b-5 m-l-20"
            :text="$t('server')"
        />
        <text-field
            v-model="connection.server"
            row="2"
            col="0"
            class="input m-l-20 m-x-10"
            autocapitalizationType="none"
            autocorrect="false"
            keyboardType="url"
            @textChange="connectionEdited"
        />
        <label
            row="1"
            col="1"
            class="label m-b-5"
            :text="$t('settings_port')"
        />
        <text-field
            v-model="connection.port"
            row="2"
            col="1"
            class="input m-r-10 serverselector--port"
            autocapitalizationType="none"
            autocorrect="false"
            keyboardType="integer"
            @textChange="connectionEdited"
        />
        <label
            row="1"
            col="2"
            class="label m-b-5"
            text="TLS"
        />
        <switch
            v-model="connection.tls"
            class="switch m-r-20"
            row="2"
            col="2"
            @checkedChanged="connectionEdited"
        />

    </grid-layout>
</template>

<script>
'kiwi public';

import _ from 'lodash';
import getBncLogin from '@mobile/libs/BncLogin';

export default {
    props: {
        networkList: {
            type: Array,
            default: () => [],
        },
        connection: {
            type: Object,
            default: () => {},
        },
    },
    data: function data() {
        return {
            name: 'custom',
            presetNetworks: [],
            isCustom: true,
            selectingServer: true,
        };
    },
    computed: {
        dropdownOptions() {
            return [{ id: 'custom', title: 'Custom Server' }, ...this.presetNetworks.map((presetNetwork) => ({
                id: presetNetwork.name,
                title: presetNetwork.name,
            }))];
        },
    },
    watch: {
        'connection.tls': function watchTls(newTls, oldTls) {
            // Switching the port only if were currently using the most common TLS/plain text ports
            if (!this.isUsingBnc) {
                if (newTls && this.connection.port === 80) {
                    this.connection.port = 443;
                } else if (!this.connection.tls && this.connection.port === 443) {
                    this.connection.port = 80;
                }
            } else if (newTls && this.connection.port === 6667) {
                this.connection.port = 6697;
            } else if (!this.connection.tls && this.connection.port === 6697) {
                this.connection.port = 6667;
            }
        },
        'connection.port': function watchPort(newPort, oldPort) {
            const parsedValue = parseInt(this.connection.port, 10);
            // eslint-disable-next-line eqeqeq
            if (this.connection.port != parsedValue) {
                this.connection.port = parsedValue || '';
            }
        },
    },
    created() {
        if (this.networkList) {
            this.importUris(this.networkList);
        }

        // If the given network is in the preset server list, select it
        let con = this.connection;
        const activePresetNetwork = _.find(
            this.presetNetworks,
            (s) => s.server === con.server && s.port === con.port && s.tls === con.tls
        );

        if (activePresetNetwork) {
            this.name = activePresetNetwork.name;
            this.isCustom = false;
        }

        const bncLogin = getBncLogin();
        this.isUsingBnc = !!bncLogin?.bouncer?.bnc.enabled;

        if (!this.connection.port) {
            this.connection.port = !this.isUsingBnc ? 443 : 6697;
        }

        this.$nextTick(() => { this.selectingServer = false; });
    },
    methods: {
        selectedNetwork(selectedServer) {
            this.selectingServer = true;
            let newPreset = this.presetNetworks.find((network) => network.name === selectedServer);
            if (!newPreset) {
                // selected custom
                newPreset = {
                    name: 'custom',
                    server: '',
                    port: !this.isUsingBnc ? 443 : 6697,
                    tls: true,
                };
            }

            this.name = newPreset.name;
            this.connection.server = newPreset.server;
            this.connection.port = newPreset.port;
            this.connection.tls = newPreset.tls;

            this.isCustom = newPreset.name === 'custom';
            this.$emit('presetSelected', newPreset);

            this.$nextTick(() => { this.selectingServer = false; });
        },
        connectionEdited(e) {
            if (this.selectingServer) {
                return;
            }
            console.log('CONNECTION EDITED!!!!');
            this.name = 'custom';
            this.isCustom = true;
        },
        // parseFormatted - Parse freenode|irc.freenode.net:+6697 links
        parseFormatted(input) {
            let ret = {
                name: '',
                server: '',
                port: 6667,
                tls: false,
            };

            let val = input;

            let pipePos = val.indexOf('|');
            if (pipePos > -1) {
                ret.name = val.substr(0, pipePos);
                val = val.substr(pipePos + 1);
            }

            let colonPos = val.indexOf(':');
            if (colonPos === -1) {
                ret.server = val;
                val = '';
            } else {
                ret.server = val.substr(0, colonPos);
                val = val.substr(colonPos + 1);
            }

            if (val[0] === '+') {
                ret.tls = true;
                val = val.substr(1);
            }

            if (val.length > 0) {
                ret.port = parseInt(val, 10);
                val = '';
            }

            if (!ret.name) {
                ret.name = ret.server;
            }

            return ret;
        },
        importUris(serverList) {
            // [ 'freenode|irc.freenode.net:+6697', 'irc.snoonet.org:6667' ]
            let servers = serverList.map((s) => this.parseFormatted(s));
            this.$set(this, 'presetNetworks', servers);
        },
    },
};
</script>

<style>
.serverselector--port {
    font-family: monospace;
}
</style>
