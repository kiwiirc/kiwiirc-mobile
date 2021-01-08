<template>
    <grid-layout
        rows="25 25"
        columns="auto * auto"
        class="statebrowser-channel"
        :class="{
            'statebrowser-channel-active': active,
            'statebrowser-channel-notjoined':
                buffer.isChannel() && !buffer.joined,
        }"
        @tap="tapped"
        v-cellHighlight
    >
        <absolute-layout
            col="0"
            row="0"
            rowSpan="2"
            v-if="buffer.isQuery()"
            class="statebrowser-channel-avatar-container"
        >
            <avatar
                class="statebrowser-channel-avatar"
                :user="network.userByName(buffer.name)"
                :nick="buffer.name"
            />
            <away-status-indicator
                class="statebrowser-channel-awaystatusindicator"
                :network="network"
                :user="network.userByName(buffer.name)"
                toggle="false"
            />
        </absolute-layout>

        <label
            row="0"
            col="1"
            class="statebrowser-channel-name"
            :text="buffer.name"
        />
        <label
            row="0"
            col="2"
            v-if="buffer.flags.unread && showMessageCounts"
            class="statebrowser-channel-label"
            :class="{
                'statebrowser-channel-label--highlight': buffer.flags.highlight,
            }"
            :text="buffer.flags.unread"
        />
        <label v-if="lastMessage"
               row="1"
               col="1"
               class="statebrowser-channel-lastmessage"
               :text="lastMessagePreview"
        />
        <label
            v-if="lastMessage"
            row="1"
            col="2"
            class="statebrowser-channel-lastmessage-time"
        >
            <formatted-string>
                <span class="spacer">&nbsp;</span>
                <span :text="lastMessageTime" />
            </formatted-string>
        </label>
        <label v-if="buffer.isChannel() &&
                   !buffer.joined &&
                   !lastMessage &&
                   network.state === 'connected'"
               row="1"
               col="2"
               class="statebrowser-channel-join-icon"
        >
            <formatted-string>
                <span class="fas" text="" />
            </formatted-string>
        </label>
    </grid-layout>
</template>

<script>
'kiwi public';

import { strftime } from '@mobile/libs/utils/lang';

export default {
    props: {
        buffer: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            queryUser: null,
        };
    },
    computed: {
        active() {
            return (
                this.buffer.networkid === this.$state.ui.active_network &&
                this.buffer.name === this.$state.ui.active_buffer
            );
        },
        showMessageCounts() {
            return !this.buffer.setting('hide_message_counts');
        },
        lastMessage() {
            return this.buffer.getLatestMessage();
        },
        lastMessagePreview() {
            let msg = this.lastMessage;
            if (!msg) {
                return '';
            }

            if (this.buffer.isQuery()) {
                return msg.message;
            } else {
                return `${msg.nick}: ${msg.message}`;
            }
        },
        lastMessageTime() {
            let msg = this.lastMessage;
            if (!msg) {
                return '';
            }

            if (new Date().getDay() !== new Date(msg.time).getDay()) {
                return strftime(
                    this.$t('date_divider_format'),
                    new Date(msg.time)
                );
            } else {
                return strftime(
                    this.buffer.setting('timestamp_format') || '%T',
                    new Date(msg.time)
                );
            }
        },
        network() {
            return this.buffer.getNetwork();
        },
        // If this buffer is a query() then return the user
        // queryUser() {

        //     return user;
        // },
    },
    methods: {
        tapped(event) {
            this.$emit('activate');
        },
    },
};
</script>

<style lang="scss">
.statebrowser-channel-avatar-container {
    vertical-align: center;
}
.awaystatusindicator.statebrowser-channel-awaystatusindicator {
    left: 28;
    top: 0;
}

/* Channel Styling */
.statebrowser-channel {
    font-size: 18;
    padding-top: 10;
    padding-bottom: 10;
    padding-left: 20;
    padding-right: 10;
}

.statebrowser-channel-lastmessage,
.statebrowser-channel-lastmessage-time {
    font-size: 14;
    color: var(--neutral4);
    vertical-align: bottom;
}

.statebrowser-channel-lastmessage-time {
    font-size: 12;
    horizontal-align: right;
    margin-left: 5;
    margin-right: 10;

    .spacer {
        font-size: 14;
    }
}

.statebrowser-channel-join-icon {
    color: var(--actiongo2);
    text-align: center;
    width: 40;
}

.statebrowser-channel-avatar-container {
    margin-right: 10;
}

.statebrowser-channel .statebrowser-channel-name {
    padding: 0 0;
    vertical-align: center;
    color: var(--default-fg);
}

.statebrowser-channel-notjoined .statebrowser-channel-name {
    color: var(--neutral4);
    font-style: italic;
}

.statebrowser-channel-active .statebrowser-channel-name {
    /* color: #df6b26; */
}
.statebrowser-channel-label {
    font-size: 12;
    text-align: center;
    background-color: var(--neutral3);
    color: var(--neutral1);
    min-width: 24;
    border-radius: 50%;
    padding: 3 5;
    height: 24;
    horizontal-align: right;
    margin-right: 10;
}
.statebrowser-channel-label--highlight {
    background-color: var(--accentstrong3);
    color: var(--accentstrong1);
}
</style>
