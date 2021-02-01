<template>
    <grid-layout
        class="channellist"
        columns="*"
        rows="100, *"
    >
        <label
            v-if="!isConnected"
            row="1"
            class="label"
            horizontalAlignment="center"
            verticalAlignment="center"
            :text="$t('state_disconnected')"
        />

        <dock-layout
            v-show="isConnected"
            row="0"
            class="p-x-20 default-bg"
            iosOverflowSafeArea="false"
            verticalAlignment="top"
        >
            <label
                v-show="listState"
                :class="{ 'soft-blink': isLoading }"
                :text="
                    isLoading
                        ? $t('updating')
                        : $t('channelsfound', {
                            count: channelCount,
                        })
                "
                dock="bottom"
                class="small-info m-l-10 m-t-10 m-b-5"
            />
            <button
                :class="{ spin: isLoading }"
                :text="isLoading ? '' : ''"
                dock="right"
                class="btn btn-icon btn-accent fas channellist-search m-t-15"
                horizontalAlignment="right"
                @tap="maybeUpdateList"
            />

            <icon-text-field
                v-model="channelSearchInput"
                :hint="'# ' + $t('search_channel')"
                class="m-t-15 m-r-20"
                returnKeyType="search"
                autocapitalizationType="none"
                autocorrect="false"
                keyboardType="email"
                icon=""
                @focus="searchChannelFocus()"
                @textChange="updateSearch"
            />
        </dock-layout>

        <list-view
            v-show="isConnected && isUpdated"
            v-dismissesIOSKeyboard
            row="1"
            for="channel in filteredList"
            class="channellist-list"
            @itemLoading="itemLoading"
        >
            <v-template
                if="!channel.new"
                name="join-channel"
            >
                <grid-layout
                    :class="{ odd: $even }"
                    columns="*, auto, 50"
                    rows="35, 10, auto"
                    class="channellist-item"
                >
                    <label
                        :text="channel.channel"
                        row="0"
                        col="0"
                        class="channellist-channel"
                    />
                    <label
                        col="1"
                        class="channellist-numusers"
                    >
                        <formatted-string>
                            <span
                                class="fas"
                                text=" "
                            />
                            <span
                                :text="
                                    channel.num_users >= 0
                                        ? channel.num_users
                                        : '-'
                                "
                                class=""
                            />
                        </formatted-string>
                    </label>
                    <button
                        col="2"
                        class="btn btn-icon btn-small btn-accent"
                        ios:paddingBottom="4"
                        color="white"
                        horizontalAlignment="right"
                        @tap="addChannel(channel)"
                    >
                        <span
                            class="fas"
                            text=""
                        />
                    </button>
                    <label
                        col="0"
                        row="1"
                        colSpan="3"
                        class="divider"
                    />
                    <formatted-message
                        :blocks="parseTopic(channel.topic)"
                        row="2"
                        colSpan="3"
                        class="channellist-topic p-b-10"
                        textWrap="true"
                    />
                </grid-layout>
            </v-template>
            <v-template
                if="channel.new"
                name="create-channel"
            >
                <grid-layout
                    :class="{ odd: $even }"
                    columns="*, 50"
                    rows="auto, 35"
                    class="channellist-item"
                >
                    <label
                        :text="$t('create_channel')"
                        row="0"
                        colSpan="3"
                        class="channellist-topic font-italic p-b-10"
                        textWrap="true"
                        verticalAlignment="bottom"
                    />
                    <label
                        :text="channel.channel"
                        row="1"
                        col="0"
                        class="channellist-channel"
                    />
                    <button
                        col="1"
                        row="1"
                        class="btn btn-icon btn-small btn-actiongo fas m-5"
                        color="white"
                        horizontalAlignment="right"
                        text=""
                        @tap="addChannel(channel)"
                    />
                </grid-layout>
            </v-template>
        </list-view>
    </grid-layout>
</template>

<script>
'kiwi public';

import _ from 'lodash';
import { alert } from '@nativescript/core/ui/dialogs';
import { isIOS } from '@nativescript/core';

import parseMessage from '@/libs/MessageParser';
import { joinChannels } from '@mobile/libs/utils/channel';

export default {
    props: ['network', 'search'],
    data() {
        return {
            isLoading: false,
            channelSearchInput: '#',
            channelCount: 0,
            filteredList: [],
        };
    },
    computed: {
        isConnected() {
            return this.network && this.network.state === 'connected';
        },
        isUpdated() {
            return this.listState === 'updated';
        },
        noResults() {
            return (
                this.listState === 'updated' && this.filteredList.length === 0
            );
        },
        listState() {
            return this.network.channel_list_state;
        },
        list() {
            return _.sortBy(
                this.network.channel_list || [],
                'num_users'
            ).reverse();
        },
    },
    watch: {
        listState(newState, oldState) {
            if (newState === 'updated') {
                this.filterList();
            }
        },
        channelSearchInput(newSearch, oldSearch) {
            this.throttledFilterList();
        },
    },
    mounted() {
        this.throttledFilterList = _.throttle(() => {
            this.filterList();
        }, 500).bind(this);

        if (this.list.length !== 0) {
            this.filterList();
        }

        if (this.search) {
            this.channelSearchInput = this.search;
        }
    },
    methods: {
        itemLoading(args) {
            /* global UITableViewCellSelectionStyle */
            if (isIOS) {
                const iosCell = args.ios;
                iosCell.selectionStyle = UITableViewCellSelectionStyle.None;
            }
        },
        maybeUpdateList(withConnectionAlert = true) {
            if (!this.isConnected) {
                if (withConnectionAlert) {
                    alert({
                        title: this.$t('warning'),
                        message: this.$t('not_connected'),
                        okButtonText: this.$t('ok'),
                    });
                }
                return;
            }

            if (this.listState !== 'updating') {
                this.isLoading = true;
                this.network.ircClient.raw('LIST');
            }
        },
        parseTopic(rawTopic) {
            let topic = rawTopic.replace(/^\[([^\]]+)\] ?/, '');

            return parseMessage(
                topic,
                {
                    extras: true,
                },
                null
            );
        },
        addChannel(channel) {
            const newChannelVal = channel.channel;
            this.channelSearchInput = '';

            joinChannels(this.network, newChannelVal);
        },
        filterList() {
            let list = [];

            if (this.channelSearchInput.length <= 2) {
                list = this.list;
                this.channelCount = list.length;
                this.filteredList = list;
                this.isLoading = false;
                return;
            }

            this.isLoading = true;
            list = this.list.filter((channel) => {
                let found = false;
                if (
                    channel.channel
                        .toLowerCase()
                        .indexOf(this.channelSearchInput) > -1
                ) {
                    found = true;
                }
                if (
                    channel.topic
                        .toLowerCase()
                        .indexOf(this.channelSearchInput) > -1
                ) {
                    found = true;
                }
                return found;
            });

            this.channelCount = list.length;

            let newChannelName =
                (this.channelSearchInput.startsWith('#') ? '' : '#') +
                this.channelSearchInput;

            newChannelName = newChannelName.replace(/\s/g, '');

            if (
                !this.list.some((channel) => channel.channel === newChannelName)
            ) {
                list.push({
                    channel: newChannelName,
                    topic: '',
                    new: true,
                });
            }
            this.filteredList = list;
            this.isLoading = false;
        },
    },
};
</script>

<style lang="scss">
.channellist-info {
    vertical-align: center;
}

.channellist-list {
    separator-color: transparent;
    background-color: transparent;
}

.channellist-item {
    padding: 10 20;

    &.odd {
        background-color: var(--neutral2);
    }

    .channellist-channel {
        vertical-align: center;
        color: var(--accent3);
        font-weight: bold;
    }

    .channellist-topic {
        color: var(--default-fg);
        font-size: 12;
        line-height: 1;
    }

    .channellist-numusers {
        color: var(--default-fg);
        vertical-align: center;
        font-size: 14;
    }
}

.btn.btn-icon.btn-small {
    border-radius: 15;
    padding: 2;
    height: 30;
    width: 30;
}
</style>
