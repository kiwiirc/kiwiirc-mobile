<template>
    <action-bar class="action-bar">
        <NavigationButton visibility="collapsed" />
        <grid-layout
            columns="auto, *, auto, auto, auto"
            width="100%"
            padding="0"
            ios:paddingRight="10"
            ios:paddingLeft="10"
        >
            <button
                class="header-option back fas"
                textAlignment="left"
                :class="{ 'header-option-highlight': hasHighlight }"
                text=""
                @tap="backToTop"
            />

            <label
                col="1"
                class="header-title"
                :text="windowTitle"
                @tap="$emit('titleTap')"
            />
            <transition name="bounce" appear>
                <connection-indicator
                    col="2"
                    class="m-r-10"
                    :loadingState="loadingState"
                    horizontalAlignment="right"
                    @loadingTap="$emit('loadingTap')"
                />
            </transition>
            <button
                v-show="!sidebarFixed && showChannelActions"
                col="3"
                class="header-option fas"
                text=""
                @tap="$state.$emit('sidebar.toggle')"
            />
            <button
                v-show="showChannelActions"
                col="4"
                class="header-option fas"
                text=""
                @tap="$emit('openChannelMenu', $event)"
            />
            <button
                v-show="showCloseBuffer"
                col="5"
                class="header-option fas"
                ios:style="margin-right: 15;"
                text=""
                @tap="$emit('closeBuffer')"
            />
        </grid-layout>
    </action-bar>
</template>

<script>
'kiwi public';

import ConnectionIndicator from '@mobile/components/ConnectionIndicator';

export default {
    components: { ConnectionIndicator },
    props: {
        showChannelActions: {
            type: Boolean,
            default: false,
        },
        showCloseBuffer: {
            type: Boolean,
            default: false,
        },
        windowTitle: {
            type: String,
            default: '',
        },
        loadingState: {
            type: String,
            default: 'done',
        },
    },
    data() {
        return {
            stateBrowserFixed: false,
            sidebarFixed: false,
        };
    },
    computed: {
        hasHighlight() {
            return this.$state.networks.some((network) => network.buffers.some(
                (buffer) => buffer.flags.highlight && buffer.flags.unread
            ));
        },
    },
    created() {
        this.listen(this.$state, 'layout.update', (layout) => {
            this.stateBrowserFixed = layout.stateBrowserFixed;
            this.sidebarFixed = layout.sidebarFixed;
        });
    },
    methods: {
        backToTop() {
            // this.$navigateTo(App, {
            //     clearHistory: true,
            //     transition: { name: 'slideLeft' },
            // });
            this.$navigateBack({}, this.nativeView.page.frame.backStack[0]);
        },
    },
};
</script>

<style lang="scss">
.bounce-enter-active {
    animation-name: bounce-in;
    animation-duration: 1s;
    animation-fill-mode: forwards;
    animation-timing-function: ease-in-out;
}

.bounce-leave-active {
    animation-name: bounce-in;
    animation-duration: 0.25s;
    animation-fill-mode: forwards;
    animation-direction: reverse;
    animation-timing-function: ease-in-out;
}

@keyframes bounce-in {
    0% {
        transform: scale(0);
    }

    50% {
        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
    }
}
</style>
