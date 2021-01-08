<template>
    <modal-stack class="modal-container" verticalPosition="bottom">
        <grid-layout
            class="modal"
            rows="40, auto, auto"
            columns="20, *, 35, 30"
        >
            <away-status-indicator
                :network="network"
                :user="network.currentUser()"
            />
            <label row="0" col="1" class="h2" :text="network.nick" />
            <label
                v-show="!self_user_settings_open"
                row="1"
                col="1"
                colSpan="2"
                class="body selfuser-host"
                textWrap="true"
                >{{ netUser.username }}@{{ netUser.host }} (
                {{ modeString }} )</label
            >
            <label
                v-show="!self_user_settings_open"
                row="0"
                col="3"
                class="selfuser-actions action-edit btn fas"
                text=""
                @tap="openSelfActions"
            />
            <text-field
                class="selfuser-actions"
                row="1"
                col="1"
                v-model="new_nick"
                v-show="self_user_settings_open"
            />
            <label
                v-show="self_user_settings_open"
                row="1"
                col="2"
                class="selfuser-actions action-cancel btn m-l-10 fas"
                text=""
                @tap="self_user_settings_open = false"
            />
            <label
                v-show="self_user_settings_open"
                row="1"
                col="3"
                class="selfuser-actions action-ok btn fas"
                text=""
                @tap="userNameUpdate(new_nick)"
            />
            <label
                col="1"
                row="2"
                colSpan="3"
                v-if="error_message"
                textWrap="true"
                class="selfuser-error-message body"
                >{{ error_message }}</label
            >
        </grid-layout>
    </modal-stack>
</template>

<script>
'kiwi public';

export default {
    props: {
        network: Object,
    },
    data: function data() {
        return {
            new_nick: '',
            error_message: '',
            self_user_settings_open: false,
        };
    },
    computed: {
        modeString() {
            let str = '';
            this.network.ircClient.user.modes.forEach(mode => {
                str += mode;
            });

            // Only show the + if there are modes to show
            if (str) {
                str = '+' + str;
            }

            return str;
        },
        netUser() {
            return this.network.ircClient.user;
        },
    },
    created() {
        this.listen(this.network.ircClient, 'nick in use', event => {
            this.error_message = `The nickname '${event.nick}' is already in use!`;
        });
    },
    methods: {
        openSelfActions() {
            this.self_user_settings_open = true;
        },
        userNameUpdate(newNick) {
            let nick = newNick.trim();
            if (nick.length === 0) {
                this.error_message = 'You must enter a new username';
                return;
            }
            if (nick.match(/(^[0-9])|(\s)/)) {
                this.error_message = 'Username must not start with a number';
                return;
            }
            this.error_message = '';
            this.network.ircClient.changeNick(nick);
            this.self_user_settings_open = false;
        },
        networkSupportsAway() {
            return this.network.ircClient.network.cap.isEnabled('away-notify');
        },
        checkUserAway() {
            return !!this.network.currentUser().away;
        },
        getUserFromString(name) {
            return this.$state.getUser(this.network.id, name);
        },
    },
};
</script>

<style>
.modal-container {
}

.modal {
    padding: 10;
    border-radius: 5;
    horizontal-align: center;
    vertical-align: middle;
    width: 250;
    margin-bottom: 50dpi;
    background-color: #fff;
}

.selfuser-actions.btn {
    text-align: center;
    height: 30;
    width: 30;
    font-size: 20;
    margin: 0;
    padding: 5 0;
}
text-field.selfuser-actions {
    width: 100%;
}

.selfuser-error-message {
    padding: 5;
}
</style>
