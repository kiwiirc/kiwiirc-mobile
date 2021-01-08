<template>
    <grid-layout
        :marginBottom="keyboardHeight"
        rows="*, auto"
        class="messagelist-container"
    >
        <message-list
            ref="messageList"
            :buffer="buffer"
            :marginBottom="showJoinChannel ? 50 : 0"
            row="0"
            @pullToRequest="requestChathistory"
            @newMessagesCountChanged="newMessagesCount = $event"
        />

        <transition name="messagelist-new-messages-counter">
            <grid-layout
                v-show="newMessagesCount > 0"
                :marginBottom="20 - keyboardPositionY"
                class="messagelist-new-messages-counter-container"
                @tap="messageListScrollToBottom"
            >
                <label
                    row="0"
                    class="messagelist-new-messages-chevron text-center fas"
                    text=""
                    @loaded="centerLabel"
                />
                <label
                    v-show="newMessagesCount > 0"
                    :text="newMessagesCount"
                    row="0"
                    class="text-center wiggly messagelist-new-messages-counter"
                    translateX="30"
                />
            </grid-layout>
        </transition>

        <content-view
            v-show="showJoinChannel"
            :class="['messagelist-message-join-channel']"
            row="0"
            height="50"
            verticalAlignment="bottom"
        >
            <button
                :text="$t('bufferkey_rejoin', { channel: buffer.name })"
                verticalAlignment="center"
                horizontalAlignment="center"
                class="btn btn-link rejoin-channel m-0"
                @tap="rejoinChannel"
            />
        </content-view>

        <content-view
            :translateY="keyboardPositionY"
            row="0"
            verticalAlignment="bottom"
        >
            <auto-complete
                v-show="autoCompleteItems.length > 0 && !showJoinChannel"
                :items="autoCompleteItems"
                @selected="applyAutoComplete"
            />
        </content-view>

        <control-input
            ref="controlInput"
            :buffer="buffer"
            row="1"
            @updateAutoCompleteItems="autoCompleteItems = $event"
            @keyboardPositionChanged="keyboardPositionY = $event"
        />
    </grid-layout>
</template>

<script>
'kiwi public';

import { isIOS } from 'tns-core-modules/platform';

import { verticalCenterLabel } from '@mobile/libs/utils/ui';
import MessageList from './MessageList';
import ControlInput from './ControlInput';
import AutoComplete from './AutoComplete';

export default {
    components: {
        ControlInput,
        MessageList,
        AutoComplete,
    },
    props: {
        buffer: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            autoCompleteItems: [],
            keyboardPositionY: 0,
            keyboardHeight: 0,
            newMessagesCount: 0,
        };
    },
    computed: {
        networkState() {
            return this.buffer ? this.buffer.getNetwork().state : 'unknown';
        },
        showJoinChannel() {
            return (
                this.buffer &&
                this.buffer.isChannel() &&
                this.buffer.joined === false &&
                this.bufferIsReady
            );
        },
        bufferIsReady() {
            return this.buffer && this.buffer.isReady();
        },
    },
    mounted() {
        this.listen(this.$state, 'ui.chat-clean-up', () => {
            this.cleanUp();
        });
    },
    methods: {
        centerLabel(e) {
            verticalCenterLabel(e.object);
        },
        cleanUp() {
            this.autoCompleteItems = [];
            this.$refs.controlInput.blur();
        },
        applyAutoComplete(item) {
            this.$refs.controlInput.applyAutoComplete(item);
        },
        rejoinChannel() {
            this.buffer.flags.channel_badkey = false;
            this.buffer.join();
        },
        shouldShowChathistoryTools() {
            // Only show it if we're connected
            if (this.buffer.getNetwork().state !== 'connected') {
                return false;
            }

            let isCorrectBufferType =
                this.buffer.isChannel() || this.buffer.isQuery();
            let isSupported = !!this.buffer
                .getNetwork()
                .ircClient.chathistory.isSupported();
            return (
                isCorrectBufferType &&
                isSupported &&
                this.buffer.flags.chathistory_available
            );
        },
        requestChathistory() {
            if (this.bufferIsReady) {
                this.buffer.requestScrollback();
            }
        },
        messageListScrollToBottom() {
            this.$refs.messageList.scrollToBottom(true);
        },
    },
};
</script>

<style lang="scss">
.messagelist-container {
    background-color: var(--default-bg);
}

.messagelist-new-messages-counter-container {
    color: var(--neutral3);

    vertical-align: bottom;
    horizontal-align: right;
    margin-bottom: 20;
    margin-right: 20;
    transform: translateX(100);

    .messagelist-new-messages-chevron {
        background-color: var(--form-bg);
        color: var(--neutral3);
        font-size: 30;
        vertical-align: center;
        horizontal-align: center;
        text-align: center;
        margin: 5;
        line-height: 100%;
        border-radius: 25;
        height: 50;
        width: 50;
    }

    .messagelist-new-messages-counter {
        background-color: var(--success3);
        color: var(--default-bg);
        border-radius: 10;
        height: 20;
        min-width: 20;
        padding-left: 5;
        padding-right: 5;
        font-size: 14;
        vertical-align: top;
        horizontal-align: right;
    }
}

.messagelist-new-messages-counter-enter-active {
    animation-name: left-drop;
    animation-duration: 0.5s;
    animation-fill-mode: forwards;
    animation-timing-function: ease-in-out;
}

.messagelist-new-messages-counter-leave-active {
    animation-name: left-drop;
    animation-duration: 0.5s;
    animation-fill-mode: forwards;
    animation-direction: reverse;
    animation-timing-function: ease-in-out;
}

@keyframes left-drop {
    0% {
        transform: translateX(100);
        // transform: scale(0, 0);
    }

    100% {
        transform: translateX(0);
        // transform: scale(1, 1);
    }
}

.messagelist-message-join-channel {
    background-color: rgba(47, 72, 85, 0.2);
    button.btn.btn-link.rejoin-channel {
        color: var(--neutral4);
    }
}

</style>
