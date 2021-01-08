<template>
    <page
        id="query-page"
        :buffername="buffer.name"
        :networkid="buffer.networkid"
        @navigatingFrom="navigatingFrom"
    >
        <buffer-action-bar
            :windowTitle="windowTitle"
            :isChannel="false"
            :showCloseBuffer="true"
            @closeBuffer="closeBuffer"
            :loadingState="loadingState"
            @loadingTap="loadingTap"
        />
        <buffer-chat :buffer="buffer" ref="buffer-chat" />
    </page>
</template>

<script>
'kiwi public';

import _ from 'lodash';

import BufferChat from './BufferChat';

export default {
    components: { BufferChat },
    props: ['buffer'],
    data() {
        return {
            autocompleteItems: [],
            keyboardHeight: 0,
        };
    },
    computed: {
        windowTitle() {
            return _.get(this, 'buffer.name', this.$state.settings.windowTitle);
        },
        loadingState() {
            return this.buffer.getLoadingState();
        },
    },
    methods: {
        navigatingFrom() {
            if (this.$refs['buffer-chat']) {
                this.$refs['buffer-chat'].cleanUp();
            }
        },
        closeBuffer() {
            this.$state.removeBuffer(this.buffer);
            this.$navigateBack();
        },
        loadingTap() {
            if (this.loadingState === 'disconnected') {
                this.$state.$emit('network.connect', this.buffer.getNetwork());
            }
        },
    },
};
</script>
