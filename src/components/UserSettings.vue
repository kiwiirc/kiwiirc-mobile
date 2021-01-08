<template>
    <page id="user-settings">
        <basic-action-bar :windowTitle="$t('profile_settings')" />
        <scroll-view>
            <stack-layout class="p-b-20">
                <avatar
                    class="user-settings-avatar"
                    :user="user"
                    :large="true"
                />
                <dock-layout
                    v-if="networkSupportsAway()"
                    class="p-x-20 m-t-15"
                    height="40"
                >
                    <switch
                        v-model="awayStatus"
                        dock="right"
                        class="switch m-0"
                    />
                    <label class="label" :text="$t('away')" />
                </dock-layout>

                <label v-if="networkSupportsAway()" class="divider m-y-15" />

                <dock-layout class="p-x-20">
                    <label
                        v-if="errorMessage"
                        dock="bottom"
                        colSpan="3"
                        class="body text-danger"
                        :text="errorMessage"
                    />

                    <button
                        v-show="!editNickMode"
                        dock="right"
                        class="btn btn-accent fas btn-icon"
                        text=""
                        @tap="editNickMode = true"
                    />

                    <button
                        v-show="editNickMode"
                        dock="right"
                        class="btn btn-actiongo fas btn-icon"
                        text=""
                        @tap="userNameUpdate(newNick)"
                    />

                    <button
                        v-show="editNickMode"
                        dock="right"
                        class="btn btn-danger fas btn-icon m-r-10"
                        text=""
                        horizontal-align="right"
                        @tap="
                            editNickMode = false;
                            newNick = network.nick;
                        "
                    />

                    <text-field
                        v-model="newNick"
                        class="nick-edit input m-r-10"
                        :class="{
                            editable: editNickMode,
                        }"
                        :editable="editNickMode"
                        :hint="network.nick"
                        autocapitalizationType="none"
                        autocorrect="false"
                    />
                </dock-layout>

                <label v-if="networkSupportsAway()" class="divider m-y-15" />

                <dock-layout class="p-x-20">
                    <button
                        dock="right"
                        class="btn fas btn-danger btn-icon"
                        text=""
                        @tap="forget"
                    />
                    <label class="label " :text="$t('log_out')" />
                </dock-layout>
            </stack-layout>
        </scroll-view>
    </page>
</template>

<script>
'kiwi public';

import { confirm } from '@nativescript/core/ui/dialogs';

export default {
    components: {},
    data() {
        return {
            editNickMode: false,
            newNick: '',
            errorMessage: '',
        };
    },
    computed: {
        network() {
            if (this.$state.networks.length === 1) {
                return this.$state.networks[0];
            }
            return this.$state.getActiveNetwork();
        },
        user() {
            return this.network.currentUser();
        },
        awayStatus: {
            get() {
                return !!this.network.currentUser().away;
            },
            set(val) {
                this.network.ircClient.raw('AWAY', val ? 'Currently away' : '');
            },
        },
    },
    mounted() {
        this.listen(this.network.ircClient, 'nick in use', (event) => {
            this.errorMessage = `The nickname '${event.nick}' is already in use!`;
            this.editNickMode = true;
        });
        this.newNick = this.network.nick;
    },
    methods: {
        networkSupportsAway() {
            return this.network.ircClient.network.cap.isEnabled('away-notify');
        },
        userNameUpdate(newNick) {
            let nick = newNick.trim();
            if (nick.length === 0) {
                this.errorMessage = 'You must enter a new username';
                return;
            }
            if (nick.match(/(^[0-9])|(\s)/)) {
                this.errorMessage = 'Username must not start with a number';
                return;
            }
            this.errorMessage = '';
            this.network.ircClient.changeNick(nick);
            this.editNickMode = false;
        },
        forget() {
            confirm(this.$t('confirm_logout')).then((result) => {
                if (result) {
                    this.$state.$emit('logOut');
                }
            });
        },
    },
};
</script>

<style lang="scss">
.user-settings-avatar {
    border-width: 4;
    width: 180;
    height: 180;
    font-size: 120;
    border-radius: 90;
    margin-top: 40;
}
text-field.nick-edit {
    padding: 5;
    border-width: 0;
    border-color: white;
}
text-field.nick-edit.editable {
    border-radius: 2;
    border-width: 2;
    border-color: #666;
}
</style>
