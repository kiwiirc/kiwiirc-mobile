<template>
    <page class="channelbanlist-page">
        <basic-action-bar
            class="action-bar"
            :windowTitle="buffer.name + ' - ' + $t('banned')"
        />
        <grid-layout columns="*, auto" rows="80, *">
            <label class="h2 m-l-20" :text="$t('banned')" />
            <button
                row="0"
                col="1"
                class="btn btn-icon btn-accent fas m-r-20"
                verticalAlignment="center"
                :class="{ spin: isLoading }"
                text=""
                @tap="updateBanlist"
            />
            <content-view
                col="0"
                colSpan="2"
                row="1"
                class="channelbanlist-content"
            >
                <label
                    v-if="isLoading"
                    class="body text-center"
                    verticalAlignment="center"
                    textWrap="true"
                    :text="isLoading ? $t('bans_refreshing') : ''"
                />

                <label
                    v-else-if="
                        isConnected && !isLoading && banlist.length === 0
                    "
                    class="body text-center"
                    verticalAlignment="center"
                    :text="$t('bans_nobody')"
                />

                <list-view
                    v-else
                    class="channelbanlist-table p-t-0 m-t-0"
                    separatorColor="transparent"
                    for="ban in banlist"
                    @itemLoading="onItemLoading"
                >
                    <v-template>
                        <grid-layout
                            columns="*, 50"
                            rows="auto, 25"
                            class="channelbanlist-item p-x-20 p-y-10"
                        >
                            <label
                                col="0"
                                row="0"
                                class="channelbanlist-table-mask p-t-5"
                                textWrap="true"
                                :text="ban.banned"
                            />

                            <label
                                col="0"
                                row="1"
                                class="small-info"
                                textWrap="true"
                            >
                                <formatted-string>
                                    <span :text="ban.banned_by + ' - '" />
                                    <span
                                        class="channelbanlist-table-bannedat"
                                        :text="
                                            new Date(
                                                ban.banned_at * 1000
                                            ).toDateString()
                                        "
                                    />
                                </formatted-string>
                            </label>

                            <button
                                col="2"
                                rowSpan="2"
                                class="btn btn-icon btn-secondary btn-danger fas"
                                verticalAlignment="center"
                                text=""
                                @tap="removeBan(ban)"
                            />
                        </grid-layout>
                    </v-template>
                </list-view>
            </content-view>
        </grid-layout>
    </page>
</template>

<script>
'kiwi public';

import { alert } from '@nativescript/core/ui/dialogs';
import { isIOS } from '@nativescript/core';

export default {
    props: ['buffer'],
    data() {
        return {
            banlist: [],
            isLoading: false,
        };
    },
    computed: {
        isConnected() {
            return this.buffer.getNetwork().state === 'connected';
        },
    },
    watch: {
        listState(newState, oldState) {
            this.isLoading = newState !== 'updated';
        },
    },
    mounted() {
        this.updateBanlist();
    },
    methods: {
        updateBanlist() {
            if (this.isLoading) {
                return;
            }

            if (!this.isConnected) {
                alert({
                    title: this.$t('warning'),
                    message: this.$t('not_connected'),
                    okButtonText: this.$t('ok'),
                });
                return;
            }

            let channelName = this.buffer.name;
            this.isLoading = true;
            this.buffer
                .getNetwork()
                .ircClient.banlist(channelName, (banEvent) => {
                    this.banlist = banEvent.bans;
                    this.isLoading = false;
                });
        },
        removeBan(ban) {
            const mask = ban.banned;
            let channelName = this.buffer.name;
            this.buffer.getNetwork().ircClient.unban(channelName, mask);
            this.banlist = this.banlist.filter((banItem) => banItem.banned !== mask);
        },
        onItemLoading(args) {
            if (isIOS) {
                const iosCell = args.ios;
                /* global UITableViewCellSelectionStyle */
                iosCell.selectionStyle = UITableViewCellSelectionStyle.None;
            }
        },
    },
};
</script>

<style lang="scss">
.channelbanlist-page {
    .channelbanlist-content {
        background-color: var(--default-bg);
    }

    .channelbanlist-table {
        background-color: transparent;
    }

    .channelbanlist-table-mask {
        color: var(--neutral5);
        font-weight: bold;
    }
    .channelbanlist-table-bannedat {
        vertical-align: top;
    }

    .channelbanlist-item {
        border-bottom-width: 1;
        border-bottom-color: var(--neutral2);
    }
}
</style>
