<template>
    <page id="join-channel" class="join-channel-page">
        <basic-action-bar :windowTitle="$t('add_chat')" />
        <scroll-view v-dismissesIOSKeyboard>
            <GridLayout
                rows="auto, auto"
                columns="*, *"
                verticalAlignment="center"
                width="100%"
                @layoutChanged="layoutLoaded"
            >
                <label
                    col="0"
                    class="label tab-label p-2 m-l-20"
                    :class="{'tab-label--selected': tab === 'channel'}"
                    :text="$t('join_channel')"
                    @tap="setTab('channel')"
                />
                <label
                    col="1"
                    class="label tab-label p-2 m-r-20"
                    :class="{'tab-label--selected': tab === 'nick'}"
                    :text="$t('user_message')"
                    @tap="setTab('nick')"
                />
                <GridLayout
                    ref="tab-channel"
                    row="1"
                    colSpan="2"
                    columns="*, 62"
                    rows="64, 40"
                    class="m-x-20 p-t-20"
                >
                    <TextField
                        v-model="channel"
                        col="0"
                        :hint="'#channel'"
                        class="search-value-input"
                        autocapitalizationType="none"
                        autocorrect="false"
                        @returnPress="joinChannel"
                        @focus="channelInputFocused"
                    />
                    <label
                        v-centerLabel
                        col="1"
                        class="search-value-button fas"
                        text=""
                        @tap="joinChannel"
                    />
                    <button
                        row="1"
                        colSpan="2"
                        class="btn btn-link btn-accent m-t-10 p-5"
                        verticalAlignment="top"
                        :text="$t('search_all_channels')"
                        @tap="openAddChannel()"
                    />
                </GridLayout>
                <GridLayout
                    ref="tab-nick"
                    row="1"
                    colSpan="2"
                    columns="*, 62"
                    rows="64, 40"
                    class="m-x-20 p-t-20"
                >
                    <TextField
                        v-model="nick"
                        col="0"
                        :hint="$t('nickname')"
                        class="search-value-input"
                        autocapitalizationType="none"
                        autocorrect="false"
                        @returnPress="openQuery"
                    />
                    <label
                        v-centerLabel
                        col="1"
                        class="search-value-button fas"
                        text=""
                        @tap="openQuery"
                    />
                    <label
                        row="1"
                        colSpan="2"
                        class="small-info m-x-10 m-t-10"
                        verticalAlignment="top"
                        :text="message"
                    />
                </GridLayout>
            </GridLayout>
        </scroll-view>
    </page>
</template>

<script>
'kiwi public';

import { AnimationCurve } from '@nativescript/core/ui/enums';
import { Utils } from '@nativescript/core';

import { joinChannels } from '@mobile/libs/utils/channel';
import SearchChannelPage from './SearchChannelPage';

export default {
    props: ['network'],
    data() {
        return {
            tab: 'channel',
            nick: '',
            channel: '#',
            message: '',
            queryOpening: false,
        };
    },
    methods: {
        setTab(val) {
            this.message = '';
            this.tab = val;

            const tabChannelView = this.$refs['tab-channel'].nativeView;
            const tabNickView = this.$refs['tab-nick'].nativeView;
            if (this.tab === 'channel') {
                tabChannelView.animate({
                    translate: { x: 0, y: 0 },
                    opacity: 1,
                    duration: 300,
                    delay: 0,
                    curve: AnimationCurve.easeIn,
                });
                tabNickView.animate({
                    translate: { x: this.screenWidth, y: 0 },
                    opacity: 0,
                    duration: 300,
                    delay: 0,
                    curve: AnimationCurve.easeOut,
                });
            } else if (this.tab === 'nick') {
                tabChannelView.animate({
                    translate: { x: this.screenWidth * -1, y: 0 },
                    opacity: 0,
                    duration: 300,
                    delay: 0,
                    curve: AnimationCurve.easeOut,
                });
                tabNickView.animate({
                    translate: { x: 0, y: 0 },
                    opacity: 1,
                    duration: 300,
                    delay: 0,
                    curve: AnimationCurve.easeIn,
                });
            }
        },
        layoutLoaded(event) {
            this.screenWidth = Utils.layout.toDeviceIndependentPixels(event.object.getMeasuredWidth());
            const tabNickView = this.$refs['tab-nick'].nativeView;
            tabNickView.translateX = this.screenWidth;
            tabNickView.opacity = 0;
            this.setTab('channel');
        },
        channelInputFocused() {
            // Auto insert the # if no value is already in. Easier for mobile users
            if (!this.channel) {
                this.channel = '#';
            }
        },
        joinChannel() {
            const newChannelVal = this.channel;
            joinChannels(this.network, newChannelVal);
        },
        openQuery() {
            if (this.queryOpening) {
                return;
            }
            this.message = '';
            this.queryOpening = true;
            this.network.ircClient.who(this.nick, (reply) => {
                this.queryOpening = false;
                if (!reply.users.length) {
                    this.message = this.$t('user_not_found', { nick: this.nick });
                    return;
                }
                const buffer = this.$state.getOrAddBufferByName(this.network.id, reply.target);
                this.$state.$emit('open.buffer', buffer);
            });
        },
        openAddChannel() {
            this.$navigateTo(SearchChannelPage, {
                props: {
                    network: this.network,
                    search: this.channel,
                },
            });
        },
    },
};
</script>

<style lang="scss" scoped>
.search-value-input {
    font-size: 16;
    height: 60;
    padding: 0 10;
    border-width: 2;
    border-color: var(--input-border);
    border-radius: 10 0 0 10;
    background-color: var(--input-bg);
    color: var(--default-fg);
}

.search-value-input-label {
    font-size: 20;
    font-weight: 600;
}

.search-value-button {
    height: 60;
    width: 100%;
    font-size: 20;
    margin: 0;
    text-align: center;
    border-width: 2;
    border-left-width: 0;
    border-color: var(--input-border);
    border-radius: 0 10 10 0;
    color: var(--default-bg);
    background-color: var(--success2);
}

.tab-label {
    font-weight: 600;
    vertical-align: bottom;
    horizontal-align: center;
    border-bottom-width: 2;
    border-bottom-color: transparent;
    text-align: center;
    line-height: 1;
}

.tab-label--selected {
    border-bottom-color: var(--input-border);
}
</style>
