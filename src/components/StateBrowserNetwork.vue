<template>
    <stack-layout class="statebrowser-network" iosOverflowSafeArea="false">
        <state-browser-network-header
            :network="network"
            @collapsed="collapsed = $event"
        />
        <button ref="toolBtn"
                class="btn btn-text btn-neutral m-x-20 pull-left"
                width="250"
                :class="{ 'soft-blink': toolBtnState.blink }"
                :isEnabled="toolBtnState.enabled"
                @tap="toolBtnTap()"
        >
            <formatted-string>
                <span :text="toolBtnState.text" />
                <span class="fas" :text="' ' + toolBtnState.icon" />
            </formatted-string>
        </button>
        <template v-for="(buffer) in filteredBuffers">
            <Label
                v-show="!collapsed"
                :key="buffer.name + 'sep'"
                class="sepa2"
            />
            <state-browser-channel
                v-show="!collapsed"
                :key="buffer.name"
                :buffer="buffer"
                @activate="openBuffer(buffer)"
            />

        </template>
    </stack-layout>
</template>

<script>
'kiwi public';

import * as bufferTools from '@/libs/bufferTools';
import Logger from '@/libs/Logger';
import * as Storage from '@mobile/libs/storage/AppSettings';
import StateBrowserChannel from './StateBrowserChannel';
import StateBrowserNetworkHeader from './StateBrowserNetworkHeader';

const log = Logger.namespace('StateBrowserNetwork');

export default {
    components: { StateBrowserChannel, StateBrowserNetworkHeader },
    props: ['network'],
    data() {
        return {
            collapsed: false,
        };
    },
    computed: {
        isActiveNetwork: function isActiveNetwork() {
            return this.$state.getActiveNetwork() === this.network;
        },
        filteredBuffers() {
            return bufferTools.orderBuffers(this.network.buffers);
        },
        toolBtnState() {
            const btnState = {
                enabled: true,
                blink: false,
                text: '',
                icon: '',
                state: '',
            };

            if (this.network.connection.server.trim() === '') {
                btnState.text = this.$t('settings');
                btnState.icon = '';
                btnState.state = 'not_configured';
            } else if (this.network.state === 'connected') {
                btnState.text = this.$t('add_chat');
                btnState.icon = '';
                btnState.state = 'connected';
            } else if (this.network.state === 'disconnected') {
                btnState.text = this.$t('network_connect');
                btnState.state = 'disconnected';
            } else if (this.network.state === 'connecting') {
                btnState.text = this.$t('connecting');
                btnState.blink = true;
                btnState.enabled = false;
                btnState.state = 'connecting';
            }

            return btnState;
        },
    },
    mounted() {
        this.resumeConnection();

        this.listen(this.$state, 'device.connected', () => {
            if (this.network.state === 'disconnected') {
                this.resumeConnection();
            }
        });

        this.listen(this.$state, 'app.resumed', () => {
            if (this.network.state === 'disconnected') {
                this.resumeConnection();
            }
        });

        /* global TNS_ENV */
        if (TNS_ENV !== 'production') {
            let cnt = 0;
            setInterval(() => {
                let sec = cnt / 5;
                cnt = 0;
                if (sec > 5) {
                    log('High message event rate on', this.network.name, sec + '/sec');
                }
            }, 5000);

            this.listen(this.network.ircClient, 'raw', (event) => {
                cnt++;
                // log((event.from_server ? '[S] ' : '[C] ') + this.network.name + ' ' + event.line);
            });
        }
    },
    methods: {
        toggleCollapse() {
            this.collapsed = !this.collapsed;
        },
        openBuffer(buffer) {
            this.$state.$emit('open.buffer', buffer);
        },
        toolBtnTap() {
            switch (this.toolBtnState.state) {
            case 'not_configured':
                this.openNetworkSettings();
                break;
            case 'connected':
                this.openAddChannel();
                break;
            case 'disconnected':
                this.connect();
                break;
            default: break;
            }
        },
        openNetworkSettings() {
            this.$state.$emit('server.open', {
                network: this.network,
                openTab: 'settings',
            });
        },
        openAddChannel() {
            this.$state.$emit('join-channel.show', {
                network: this.network,
            });
        },
        showNetworkChannels() {
            this.$state.$emit('open.network', {
                network: this.network,
                openTab: 'channels',
            });
        },
        connect() {
            if (this.network.state === 'disconnected') {
                this.$state.$emit('network.connect', this.network);
            }
        },
        async resumeConnection() {
            // check whether this network was connected at the time the app was suspended
            const connectedNetworks = JSON.parse(await Storage.get('connected_networks'));
            if (connectedNetworks.includes(this.network.connection.bncnetid)) {
                this.connect();
            }
        },
    },
};
</script>

<style lang="scss" scoped>
.statebrowser-network {
    margin-top: 0;
    margin-bottom: 20;
    border-top-width: 3;
    border-color: var(--primary2);
}

.sepa2 {
    height: 1;
    background-color: #dfdfdf;
    margin-left: 10;
    margin-right: 10;
    margin-top: 0;
    margin-bottom: 0;
}

</style>
