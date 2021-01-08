/* eslint-disable vue/attribute-hyphenation */
<template>
    <page
        id="channel-page"
        :buffername="buffer.name"
        :networkid="buffer.networkid"
        @navigatingFrom="navigatingFrom"
    >
        <buffer-action-bar
            :window-title="windowTitle"
            :show-channel-actions="buffer && buffer.isChannel()"
            :show-close-buffer="false"
            :loading-state="loadingState"
            @openChannelMenu="openChannelMenu"
            @titleTap="openChannelSettings"
            @loadingTap="loadingTap"
        />
        <rad-side-drawer
            ref="drawer"
            :drawerLocation="drawerLocation"
            @drawerOpened="
                isNicklistOpen = true;
                closeKeyboard();
            "
            @drawerClosed="
                isNicklistOpen = false;
                closeKeyboard();
            "
        >
            <nick-list
                ref="nick-list"
                :buffer="buffer"
                ~drawerContent
            />
            <buffer-chat
                ref="buffer-chat"
                :buffer="buffer"
                ~mainContent
            />
        </rad-side-drawer>
    </page>
</template>

<script>
'kiwi public';

import _ from 'lodash';

import { Menu } from 'nativescript-menu';
import { SideDrawerLocation } from 'nativescript-ui-sidedrawer';

import NickList from './NickList';
import BufferChat from './BufferChat';

import ChannelBanlist from './ChannelBanlist';
import ChannelInvitelist from './ChannelInvitelist';
import ChannelSettings from './ChannelSettings';
import BufferSettings from './BufferSettings';

export default {
    components: {
        NickList,
        BufferChat,
    },
    props: ['buffer'],
    data() {
        return {
            isNicklistOpen: false,
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
    created() {
        this.drawerLocation = SideDrawerLocation.Right;

        this.listen(this.$state, 'sidebar.show', this.openSidebar);
        this.listen(this.$state, 'sidebar.hide', this.closeSidebar);
        this.listen(this.$state, 'sidebar.toggle', this.toggleSidebar);

        this.listen(this.$state, 'layout.update', (layout) => {
            if (this.sidebarFixed !== layout.sidebarFixed) {
                this.closeSidebar();
            }
            this.sidebarFixed = layout.sidebarFixed;
        });
    },
    methods: {
        navigatingFrom() {
            this.closeSidebar();
            this.closeKeyboard();
        },
        closeKeyboard() {
            this.$refs['buffer-chat'] && this.$refs['buffer-chat'].cleanUp();
            this.$refs['nick-list'] && this.$refs['nick-list'].cleanUp();
        },
        openChannelMenu(event) {
            const leaveOptionText = this.$t('state_leave', {
                name: this.buffer.name,
            });

            const channelMenuOptions = [
                {
                    id: 'leave_channel',
                    title: leaveOptionText,
                },
            ];

            if (this.buffer.joined) {
                channelMenuOptions.splice(
                    0,
                    0,
                    {
                        id: 'channel_settings',
                        title: this.$t('channel_settings'),
                    },
                    {
                        id: 'notifications',
                        title: this.$t('notifications'),
                    },
                    {
                        id: 'banned_users',
                        title: this.$t('banned'),
                    },
                    {
                        id: 'invite_users',
                        title: this.$t('invited'),
                    }
                );
            }

            Menu.popup({
                view: event.object,
                actions: channelMenuOptions,
                cancelButtonText: this.$t('cancel'),
            })
                .then((value) => {
                    switch (value.id) {
                    case 'leave_channel':
                        // eslint-disable-next-line no-restricted-globals, no-alert
                        confirm({
                            title: leaveOptionText,
                            message: this.$t('prompt_leave_channel'),
                            okButtonText: this.$t('yes'),
                            cancelButtonText: this.$t('no'),
                        }).then((result) => {
                            if (result) {
                                this.closeBuffer();
                                this.$navigateBack();
                            }
                        });
                        break;
                    case 'banned_users':
                        this.$navigateTo(ChannelBanlist, {
                            props: {
                                buffer: this.buffer,
                            },
                        });
                        break;
                    case 'invite_users':
                        this.$navigateTo(ChannelInvitelist, {
                            props: {
                                buffer: this.buffer,
                            },
                        });
                        break;
                    case 'channel_settings':
                        this.openChannelSettings();
                        break;
                    case 'notifications':
                        this.$navigateTo(BufferSettings, {
                            props: {
                                buffer: this.buffer,
                            },
                        });
                        break;
                    default:
                        break;
                    }
                })
                .catch(console.log);
        },
        closeBuffer() {
            this.$state.removeBuffer(this.buffer);
        },
        toggleSidebar() {
            this.$refs.drawer.toggleDrawerState();
        },
        openSidebar() {
            this.$refs.drawer.showDrawer();
        },
        closeSidebar() {
            this.$refs.drawer.closeDrawer();
        },
        openChannelSettings() {
            this.$navigateTo(ChannelSettings, {
                props: {
                    buffer: this.buffer,
                },
            });
        },
        loadingTap() {
            if (this.loadingState === 'disconnected') {
                this.$state.$emit('network.connect', this.buffer.getNetwork());
            }
        },
    },
};
</script>

<style></style>
