<template>
    <page class="userbox-page">
        <basic-action-bar :windowTitle="user.nick" />

        <grid-layout rows="*, auto">
            <scroll-view row="0" orientation="vertical" height="*">
                <stack-layout class="form">
                    <avatar
                        :user="user"
                        v-if="user.avatar.large"
                        class="userbox-avatar"
                        :large="true"
                    />
                    <label v-else class="form-bg" height="10" />

                    <label
                        v-if="user.realname"
                        class="userbox-fullname p-y-15 default-bg"
                        :text="user.realname"
                    />

                    <label v-if="user.realname" class="divider" />

                    <dock-layout class="p-x-20 p-y-15 default-bg">
                        <button
                            dock="right"
                            class="fas btn btn-icon btn-actiongo"
                            text=""
                            @tap="openQuery"
                        />
                        <label
                            class="userbox-status m-r-15"
                            textWrap="true"
                            :text="
                                user.away
                                    ? $t('whois_status') + ': ' + user.away
                                    : $t('whois_status_available')
                            "
                        />
                    </dock-layout>

                    <label class="divider" />

                    <dock-layout class="p-x-20 p-y-15 default-bg">
                        <button
                            dock="right"
                            class="fas btn btn-icon btn-danger"
                            :text="ignoreUser ? '' : ''"
                            @tap="ignoreUser = !ignoreUser"
                        />
                        <label
                            class="label"
                            :text="
                                ignoreUser
                                    ? $t('unignore_user')
                                    : $t('ignore_user')
                            "
                        />
                    </dock-layout>

                    <label class="divider" />

                    <dock-layout class="p-x-20 p-y-15 default-bg">
                        <activity-indicator
                            dock="bottom"
                            v-show="whoisRequested && whoisLoading"
                            class="activity-indicator m-b-15"
                            :busy="whoisRequested && whoisLoading"
                        />
                        <label
                            dock="bottom"
                            v-show="whoisRequested && !whoisLoading"
                            class="userbox-whois m-t-10"
                            textWrap="true"
                            :text="moreInfo"
                        />
                        <button
                            dock="right"
                            class="fas btn btn-icon btn-accent"
                            :text="whoisRequested ? '' : ''"
                            @tap="updateWhoisData"
                        />
                        <label class="label" :text="$t('more_details')" />
                    </dock-layout>

                    <label class="divider" />
                </stack-layout>
            </scroll-view>

            <grid-layout
                row="1"
                rows="auto, auto"
                columns="auto,*,auto"
                v-if="
                    buffer && buffer.isChannel() && areWeAnOp && isUserOnBuffer
                "
                class="userbox-opactions-container default-bg"
            >
                <kiwi-dropdown
                    col="0"
                    row="0"
                    colSpan="3"
                    class="m-b-10"
                    :item="userMode"
                    :options="availableChannelModes"
                    @select="changeUserMode"
                />

                <button
                    col="0"
                    row="1"
                    @tap="kickUser"
                    class="btn btn-warning kick"
                >
                    <formatted-string>
                        <span :text="$t('user_kick') + '  '" />
                        <span class="icon fas" text="" />
                    </formatted-string>
                </button>

                <button
                    row="1"
                    col="2"
                    @tap="banUser"
                    class="btn btn-danger ban"
                >
                    <formatted-string>
                        <span :text="$t('user_ban') + '  '" />
                        <span class="icon fas" text="" />
                    </formatted-string>
                </button>
            </grid-layout>
        </grid-layout>
    </page>
</template>

<script>
'kiwi public';

import _ from 'lodash';
import { Menu } from 'nativescript-menu';
import { createNickColour } from '@/helpers/TextFormatting';

export default {
    props: {
        user: {
            type: Object,
            required: true,
        },
        network: {
            type: Object,
            required: true,
        },
        buffer: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            whoisRequested: false,
            whoisLoading: false,
            ignoreUser: false,
            actionsVisible: false,
        };
    },
    computed: {
        userColour() {
            return createNickColour(this.user.nick);
        },
        // Channel modes differ on some IRCds so get them from the network options
        availableChannelModes: function availableChannelModes() {
            let availableModes = [];
            let prefixes = this.network.ircClient.network.options.PREFIX;
            // TODO: Double check these modes mean the correct things
            let knownPrefix = {
                q: 'Owner',
                a: 'Admin',
                o: 'Operator',
                h: 'Half-Operator',
                v: 'Voice',
            };
            prefixes.forEach(prefix => {
                let mode = prefix.mode;
                if (knownPrefix[mode]) {
                    availableModes.push({
                        id: mode,
                        title: knownPrefix[mode],
                    });
                }
            });
            availableModes.push({
                id: '',
                title: this.$t('user_normal'),
            });

            return availableModes;
        },
        userMode() {
            if (!this.buffer) {
                return '';
            }

            let userBufferInfo = this.user.buffers[this.buffer.id];
            if (!userBufferInfo) {
                // Probably switched buffer while the userbox was open
                return '';
            }

            let modes = userBufferInfo.modes;
            return modes.length > 0 ? modes[0] : '';
        },
        areWeAnOp() {
            if (!this.buffer) {
                return false;
            }

            return this.buffer.isUserAnOp(this.buffer.getNetwork().nick);
        },
        isUserOnBuffer() {
            if (!this.buffer) {
                return false;
            }

            if (!this.user.buffers[this.buffer.id]) {
                // Probably switched buffer while the userbox was open
                return false;
            }

            return true;
        },
        moreInfo() {
            let moreInfo =
                `${this.$t('more_information')}:\n` + this.user.away
                    ? this.$t('whois_status') + ': ' + this.user.away
                    : this.$t('whois_status_available');

            if (this.user.account) {
                moreInfo += `\n${this.$t('user_account', {
                    user: this.user.account,
                })}`;
            }

            if (this.user.realname) {
                moreInfo += `\n${this.$t('user_realname', {
                    realname: this.user.realname,
                })}`;
            }

            if (this.user.bot) {
                moreInfo += `\n${this.$t('user_bot')}`;
            }

            if (this.user.helpop) {
                moreInfo += `\n${this.$t('user_help')}`;
            }

            if (this.user.operator) {
                moreInfo += `\n${this.$t('user_op')}`;
            }

            if (this.user.server) {
                moreInfo += `\n${this.$t('user_server', {
                    server: this.user.server,
                    info: this.user.server_info
                        ? `(${this.user.server_info})`
                        : '',
                })}`;
            }

            if (this.user.secure) {
                moreInfo += `\n${this.$t('user_secure')}`;
            }

            if (this.user.channels) {
                moreInfo += `\n${this.$t('user_channels', {
                    channels: this.user.channels,
                })}`;
            }

            return moreInfo;
        },
    },
    methods: {
        updateWhoisData() {
            this.whoisRequested = !this.whoisRequested;
            this.whoisLoading = true;
            this.network.ircClient.whois(this.user.nick, () => {
                this.whoisLoading = false;
            });
        },
        openQuery() {
            let buffer = this.$state.addBuffer(this.network.id, this.user.nick);
            this.$state.$emit('open.buffer', buffer);
            this.$modal.close();
        },
        changeUserMode(value) {
            this.setUserMode(value);
        },
        kickUser() {
            confirm(
                this.$t('user_kick_confirm', { nick: this.user.nick })
            ).then(result => {
                if (result) {
                    let reason = this.$state.setting(
                        'buffers.default_kick_reason'
                    );
                    this.network.ircClient.raw(
                        'KICK',
                        this.buffer.name,
                        this.user.nick,
                        reason
                    );
                }
            });
        },
        createBanMask() {
            let mask = this.$state.setting('buffers.default_ban_mask');
            mask = mask.replace('%n', this.user.nick);
            mask = mask.replace('%i', this.user.username);
            mask = mask.replace('%h', this.user.host);

            return mask;
        },
        banUser() {
            if (!this.user.username || !this.user.host) {
                return;
            }

            confirm(this.$t('user_ban_confirm', { nick: this.user.nick })).then(
                result => {
                    if (result) {
                        let reason = this.$state.setting(
                            'buffers.default_kick_reason'
                        );
                        let banMask = this.createBanMask();
                        this.network.ircClient.raw(
                            'MODE',
                            this.buffer.name,
                            '+b',
                            banMask
                        );
                    }
                }
            );
        },
        kickbanUser() {
            if (!this.user.username || !this.user.host) {
                return;
            }

            let banMask = this.createBanMask();
            let reason = this.$state.setting('buffers.default_kick_reason');
            this.network.ircClient.raw('MODE', this.buffer.name, '+b', banMask);
            this.network.ircClient.raw(
                'KICK',
                this.buffer.name,
                this.user.nick,
                reason
            );
        },
        setUserMode(newMode) {
            const oldMode = this.userMode;

            const changes = [];
            const targets = [];

            if (oldMode) {
                changes.push('-' + oldMode);
                targets.push(this.user.nick);
            }
            if (newMode) {
                changes.push('+' + newMode);
                targets.push(this.user.nick);
            }

            const params = ['MODE', this.buffer.name, changes.join('')].concat(
                targets
            );
            this.network.ircClient.raw(params);
        },
    },
};
</script>

<style lang="scss">
/* User box */
.avatar.userbox-avatar {
    border-width: 4;
    width: 180;
    height: 180;
    border-radius: 90;
    margin-top: 40;
}

.userbox-fullname {
    color: var(--neutral3);
}

.userbox-status,
.userbox-whois {
    background: var(--form-bg);
    color: var(--neutral5);
}

// .btn.kick,
// .btn.ban {
//     padding: 0 25;
// }

.userbox-fullname {
    width: 100%;
    text-align: center;
    font-size: 16;
}

.userbox-status {
    border-radius: 10;
    font-size: 18;
    padding: 15 10;
    text-align: center;
}

.userbox-whois {
    padding: 10;
    border-radius: 10;
}

.userbox-opactions-container {
    align-items: center;
    padding: 10 20;
    align-items: center;
    justify-content: center;
}
</style>
