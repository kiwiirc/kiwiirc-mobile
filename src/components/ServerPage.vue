<template>
    <page id="server-page" @navigatingFrom="navigatingFrom">
        <buffer-action-bar
            :windowTitle="windowTitle"
            :isChannel="false"
            :showCloseBuffer="false"
            :loadingState="loadingState"
        />
        <content-view iosOverflowSafeArea="false">
            <tabs
                ref="tabs"
                :selectedIndex="selectedIndex"
                @selectedIndexChanged="tabChanged"
                @loaded="loaded"
            >
                <tab-strip>
                    <tab-strip-item :title="$t('messages')" />
                    <tab-strip-item :title="$t('settings')" />
                    <tab-strip-item :title="$t('channels')" />
                </tab-strip>

                <tab-content-item>
                    <buffer-chat
                        v-if="serverBuffer"
                        ref="buffer-chat"
                        :buffer="serverBuffer"
                    />
                </tab-content-item>
                <tab-content-item>
                    <network-settings :network="network" :isNew="isNew" />
                </tab-content-item>
                <tab-content-item>
                    <channel-list ref="channel-list" :network="network" />
                </tab-content-item>
            </tabs>
        </content-view>
    </page>
</template>

<script>
'kiwi public';

import _ from 'lodash';
import BufferChat from './BufferChat';
import NetworkSettings from './NetworkSettings';
import ChannelList from './ChannelList';

export default {
    components: { BufferChat, NetworkSettings, ChannelList },
    props: {
        network: {
            type: Object,
            required: true,
        },
        openTab: {
            type: String,
            default: 'messages',
        },
        isNew: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            selectedIndex: 0,
        };
    },
    computed: {
        serverBuffer() {
            return this.network.serverBuffer();
        },
        windowTitle() {
            return _.get(
                this,
                'network.name',
                this.$state.settings.windowTitle
            );
        },
        networkConnected() {
            return this.network.state === 'connected';
        },
        loadingState() {
            return this.serverBuffer && this.serverBuffer.getLoadingState();
        },
    },
    methods: {
        loaded() {
            if (this.openTab === 'messages') {
                this.selectedIndex = 0;
            } else if (this.openTab === 'settings') {
                this.selectedIndex = 1;
            } else if (this.openTab === 'channels') {
                this.selectedIndex = 2;
            }
        },
        navigatingFrom() {
            if (this.$refs['buffer-chat']) {
                this.$refs['buffer-chat'].cleanUp();
            }
        },
        tabChanged(event) {
            if (event.oldIndex > 0 && event.newIndex === 0) {
                this.$state.setActiveBuffer(this.network.id, this.network.serverBuffer().name);
            }
        },
    },
};
</script>

<style>
#server-page {
    background: var(--neutral2);
}

tab-strip {
    highlight-color: var(--accent3);
    font-weight: bold;
    color: var(--default-fg);
    background-color: var(--form-bg);
}

</style>
