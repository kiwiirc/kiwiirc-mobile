<template>
    <page class="channelinvitelist-page">
        <basic-action-bar
            class="action-bar"
            :windowTitle="buffer.name + ' - ' + $t('invited')"
        />
        <grid-layout columns="*, auto" rows="80, auto, auto, *">
            <label class="h2 m-l-20" :text="$t('invited')" />
            <stack-layout row="0" col="1" orientation="horizontal">
                <button
                    v-if="!showAdd"
                    class="btn btn-icon btn-accent fas m-r-20"
                    verticalAlignment="center"
                    text=""
                    @tap="selectAccount()"
                />
                <button
                    class="btn btn-icon btn-accent fas m-r-20"
                    verticalAlignment="center"
                    :class="{ spin: isLoading }"
                    text=""
                    @tap="updateInvitelist()"
                />
            </stack-layout>
            <grid-layout
                v-if="showAdd"
                row="1"
                col="0"
                colSpan="2"
                rows="auto, auto"
                columns="*, auto, auto"
                class="channelinvitelist-add m-l-20 m-r-20"
            >
                <label
                    row="0"
                    col="0"
                    text="Add account / mask:"
                    class="channelinvitelist-add-label m-r-8"
                />
                <text-field
                    v-model="addMask"
                    row="1"
                    col="0"
                    class="channelinvitelist-input m-r-8"
                />
                <button
                    row="0"
                    col="1"
                    rowSpan="2"
                    class="btn btn-icon btn-accent fas m-r-8"
                    verticalAlignment="center"
                    text=""
                    @tap="addInvite()"
                />
                <button
                    row="0"
                    col="2"
                    rowSpan="2"
                    class="btn btn-icon btn-accent fas"
                    verticalAlignment="center"
                    text=""
                    @tap="closeAdd()"
                />
            </grid-layout>
            <grid-layout
                row="2"
                col="0"
                colSpan="2"
                columns="*, auto"
                class="channelinvitelist-toggle p-x-20 p-y-10"
            >
                <label
                    col="0"
                    class="channelinvitelist-toggle-label"
                    verticalAlignment="center"
                    :text="isInviteOnly
                        ? $t('invite_private_channel')
                        : $t('invite_public_channel')"
                />
                <switch v-model="isInviteOnly" col="1" />
            </grid-layout>
            <content-view
                row="3"
                col="0"
                colSpan="2"
                class="channelinvitelist-content"
            >
                <label
                    v-if="isLoading"
                    class="body text-center"
                    verticalAlignment="center"
                    textWrap="true"
                    :text="isLoading ? $t('invites_refreshing') : ''"
                />

                <label
                    v-else-if="
                        isConnected && !isLoading && inviteList.length === 0
                    "
                    class="body text-center"
                    verticalAlignment="center"
                    :text="$t('invites_nobody')"
                />

                <list-view
                    v-else
                    class="channelinvitelist-table p-t-0 m-t-0"
                    separatorColor="transparent"
                    for="invite in sortedInviteList"
                    @itemLoading="onItemLoading"
                >
                    <v-template>
                        <grid-layout
                            columns="*, 50"
                            rows="auto, 25"
                            class="channelinvitelist-item p-x-20 p-y-10"
                        >
                            <label
                                col="0"
                                row="0"
                                class="channelinvitelist-table-mask p-t-5"
                                textWrap="true"
                                :text="displayMask(invite)"
                            />

                            <label
                                col="0"
                                row="1"
                                class="small-info"
                                textWrap="true"
                            >
                                <formatted-string>
                                    <span :text="invite.invited_by + ' - '" />
                                    <span
                                        class="channelinvitelist-table-invitedat"
                                        :text="
                                            new Date(
                                                invite.invited_at * 1000
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
                                @tap="removeInvite(invite)"
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
import * as IrcdDiffs from '@/helpers/IrcdDiffs';

function inviteListSorter(a, b) {
    let aMask = a.invited.toUpperCase();
    let bMask = b.invited.toUpperCase();
    let aExt = aMask.indexOf(':') === 1;
    let bExt = bMask.indexOf(':') === 1;

    if (aExt && !bExt) {
        return -1;
    }
    if (!aExt && bExt) {
        return 1;
    }
    if (aMask < bMask) {
        return -1;
    }
    if (aMask > bMask) {
        return 1;
    }

    return 0;
}

export default {
    props: ['buffer'],
    data() {
        return {
            inviteList: [],
            addMask: '',
            showAdd: false,
            isLoading: false,
        };
    },
    computed: {
        isInviteOnly: {
            get() {
                return typeof this.buffer.modes.i !== 'undefined';
            },
            set(val) {
                this.buffer.getNetwork().ircClient.mode(
                    this.buffer.name,
                    val ? '+i' : '-i'
                );
            },
        },
        isConnected() {
            return this.buffer.getNetwork().state === 'connected';
        },
        supportsAccounts() {
            return !!this.extban;
        },
        extban() {
            return IrcdDiffs.extbanAccount(this.buffer.getNetwork());
        },
        sortedInviteList() {
            let inviteListToSort = this.inviteList.slice(0);
            return inviteListToSort.sort(inviteListSorter);
        },
        knownAccounts() {
            // Get an array of every account name we're aware of on the network, excluding
            // the ones we already have in our invite list
            let users = this.buffer.getNetwork().users;
            let extban = this.extban;
            let inviteAccountNames = this.inviteList.filter(
                (i) => i.invited.includes(extban + ':')
            ).map((i) => i.invited.replace(extban + ':', ''));

            let tempAccounts = Object.create(null);
            Object.values(users).forEach((user) => {
                if (user.account && !inviteAccountNames.includes(user.account)) {
                    if (!tempAccounts[user.account]) {
                        tempAccounts[user.account] = [];
                    }
                    if (user.nick.toLowerCase() !== user.account.toLowerCase()) {
                        tempAccounts[user.account].push(user.nick);
                    }
                }
            });

            let accountUsers = Object.keys(tempAccounts).sort();
            accountUsers.forEach((acc, idx) => {
                if (tempAccounts[acc].length > 0) {
                    accountUsers[idx] += ' [' + tempAccounts[acc].join(', ') + ']';
                }
            });

            return [this.$t('invite_other'), ...accountUsers];
        },
    },
    watch: {
        listState(newState, oldState) {
            this.isLoading = newState !== 'updated';
        },
    },
    mounted() {
        this.updateInvitelist();
    },
    methods: {
        displayMask(invite) {
            let display = invite.invited;
            if (this.extban && display) {
                display = display.replace(this.extban + ':', '');
            }
            return display || this.$t('invite_any_registered');
        },
        updateInvitelist() {
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
                .ircClient.inviteList(channelName, (inviteEvent) => {
                    this.inviteList = inviteEvent ?
                        inviteEvent.invites :
                        [];
                    this.isLoading = false;
                });
        },
        addInvite() {
            let invite = this.supportsAccounts && this.addMask.indexOf('@') === -1 ?
                `${this.extban}:${this.addMask}` :
                this.addMask;

            this.buffer
                .getNetwork()
                .ircClient.addInvite(this.buffer.name, invite);

            this.updateInvitelist();
            this.addMask = '';
            this.showAdd = false;
        },
        removeInvite(invite) {
            const mask = invite.invited;
            let channelName = this.buffer.name;
            this.buffer.getNetwork().ircClient.removeInvite(channelName, mask);
            this.inviteList = this.inviteList.filter((inviteItem) => inviteItem.invited !== mask);
        },
        closeAdd() {
            this.addMask = '';
            this.showAdd = false;
        },
        selectAccount() {
            if (!this.supportsAccounts) {
                this.showAdd = true;
                return;
            }

            /* global action */
            action(
                this.$t('invite_select'),
                this.$t('cancel'),
                this.knownAccounts,
            ).then((result) => {
                let mask = result;
                if (mask === this.$t('cancel')) {
                    return;
                }

                if (mask === this.$t('invite_other')) {
                    this.showAdd = true;
                    return;
                }

                // nicks which differ from account are in the format "account [nick1, nick2]"
                if (mask.includes(' ')) {
                    mask = mask.split(' ')[0];
                }

                this.addMask = mask;
                this.addInvite();
            });
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
.channelinvitelist-page {
    .channelinvitelist-content {
        background-color: var(--default-bg);
    }

    .channelinvitelist-table {
        background-color: transparent;
    }

    .channelinvitelist-table-mask {
        color: var(--neutral5);
        font-weight: bold;
    }
    .channelinvitelist-table-invitedat {
        vertical-align: top;
    }

    .channelinvitelist-item {
        border-bottom-width: 1;
        border-bottom-color: var(--neutral2);
    }

    .channelinvitelist-input {
        color: var(--neutral5);
    }

    .channelinvitelist-add-label {
        color: var(--neutral5);
    }

    .channelinvitelist-toggle {
        color: var(--neutral5);
        background-color: var(--neutral2);
    }
}
</style>
