<template>
    <dock-layout
        height="60"
        class="statebrowser-network-header"
    >
        <label
            dock="right"
            android:paddingTop="15"
            class="statebrowser-network-chevron fas m-r-10"
            :text="!!collapsed ? '' : ''"
            @tap="toggleCollapse"
        />
        <label
            v-if="serverUnread"
            class="statebrowser-channel-label"
            :class="{
                'statebrowser-channel-label--highlight': serverHighlight,
            }"
            fontSize="12"
            dock="right"
            :text="serverUnread"
        />
        <button
            dock="left"
            class="statebrowser-network-name btn btn-text"
            @tap="openNetworkSettings()"
        >
            <formatted-string>
                <span>{{ network && network.name }}</span>
            </formatted-string>
        </button>
    </dock-layout>
</template>

<script>
import * as bufferTools from '@/libs/bufferTools';

import ConnectionIndicator from '@mobile/components/ConnectionIndicator';

export default {
    components: { ConnectionIndicator },
    props: ['network'],
    data() {
        return {
            collapsed: false,
        };
    },
    computed: {
        serverBuffer() {
            return this.network.serverBuffer();
        },
        filteredBuffers() {
            if (!this.network) {
                return [];
            }
            return bufferTools.orderBuffers(this.network.buffers);
        },
        serverUnread() {
            if (!this.collapsed) {
                return this.serverBuffer.flags.unread;
            }
            const serverUnread = this.filteredBuffers.reduce(
                (sum, buffer) => sum + buffer.flags.unread,
                0
            );
            return serverUnread;
        },
        serverHighlight() {
            if (!this.collapsed) {
                return this.serverBuffer.flags.highlight;
            }
            let highlight = false;
            this.network.buffers.forEach((buffer) => {
                if (buffer.isSpecial()) {
                    return;
                }
                if (buffer.flags.highlight) {
                    highlight = true;
                }
            });
            return highlight;
        },
    },
    methods: {
        openNetworkSettings() {
            this.$state.$emit('server.open', {
                network: this.network,
                openTab: this.network.state === 'connected' ? 'messages' : 'settings',
            });
        },
        openAddChannel() {
            this.$state.$emit('join-channel.show', {
                network: this.network,
            });
        },
        toggleCollapse() {
            this.collapsed = !this.collapsed;
            this.$emit('collapsed', this.collapsed);
        },
    },

};
</script>

<style lang="scss">
.statebrowser-network-header {
    /* background-color: var(--primary1); */
    /* color: var(--neutral1); */
    color: var(--primary5);
    padding-top: 10;
}

.btn.btn-text.statebrowser-network-name,
.btn.btn-text.statebrowser-network-connect {
    font-weight: normal;
    horizontal-align: left;
    vertical-align: bottom;
}

.btn.btn-text.statebrowser-network-connect {
    color: var(--neutral5);
    font-size: 20;
    padding: 0 10 0 0;
    margin: 0 0 10 0;
    width: 160;

    .spacer{
        font-size: 32;
    }
}

.btn.btn-text.statebrowser-network-name {
    /* color: var(--default-fg); */
    color: var(--primary5);
    font-size: 32;
    padding: 0 10;
    margin: 0 10 10 10;
}

.statebrowser-network-chevron {
    font-size: 14;
    text-align: center;
    width: 40;
    color: var(--primary5);
}
</style>
