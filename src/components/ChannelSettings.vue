<template>
    <page class="channel-settings-page">
        <basic-action-bar
            :windowTitle="buffer.name + ' - ' + $t('channel_settings')"
        />
        <scroll-view v-dismissesIOSKeyboard>
            <stack-layout class="form">
                <label
                    :text="$t('channel_settings')"
                    class="form-section-header"
                />
                <label
                    :text="$t('channel_topic')"
                    class="label p-x-20 p-t-20"
                />
                <content-view>
                    <text-view
                        v-model="textViewTopic"
                        v-focusOnIOSKeyboard
                        :class="{ synced: topicSynced }"
                        class="channel-settings-topic input m-x-20 m-y-5"
                        height="100"
                        @blur="updateTopic"
                    />
                </content-view>
                <label class="divider" />
                <dock-layout class="p-x-20 p-y-15">
                    <switch v-model="modeM" dock="right" class="switch m-l-5" />
                    <label :text="$t('channel_moderated')" class="label" />
                </dock-layout>
                <label class="divider" />
                <dock-layout class="p-x-20 p-y-15">
                    <switch v-model="modeI" dock="right" class="switch m-l-5" />
                    <label :text="$t('channel_invite')" class="label" />
                </dock-layout>
                <label class="divider" />
                <dock-layout class="p-x-20 p-y-15">
                    <switch v-model="modeT" dock="right" class="switch m-l-5" />
                    <label
                        :text="$t('channel_moderated_topic')"
                        class="label"
                    />
                </dock-layout>
                <label :text="$t('password')" class="form-section-header" />
                <content-view>
                    <icon-text-field
                        v-model="textFieldPassword"
                        :class="{ synced: passwordSynced }"
                        class="channel-settings-password input m-x-20 m-y-20"
                        icon=""
                        autocapitalizationType="none"
                        autocorrect="false"
                        returnKeyType="done"
                        @returnPress="updatePassword"
                        @blur="updatePassword"
                        @cleared="updatePassword"
                    />
                </content-view>
                <label
                    :text="$t('side_settings')"
                    class="form-section-header"
                />
                <dock-layout class="p-x-20 p-y-15">
                    <switch
                        v-model="settingShowJoinParts"
                        dock="right"
                        class="switch m-l-5"
                    />
                    <label :text="$t('side_joins')" class="label" />
                </dock-layout>
                <label class="divider" />
                <dock-layout class="p-x-20 p-y-15">
                    <switch
                        v-model="settingShowTopics"
                        dock="right"
                        class="switch m-l-5"
                    />
                    <label :text="$t('side_topics')" class="label" />
                </dock-layout>
                <label class="divider" />
                <dock-layout class="p-x-20 p-y-15">
                    <switch
                        v-model="settingShowNickChanges"
                        dock="right"
                        class="switch m-l-5"
                    />
                    <label :text="$t('side_nick_changes')" class="label" />
                </dock-layout>
                <label class="divider" />
            </stack-layout>
        </scroll-view>
    </page>
</template>

<script>
'kiwi public';

// Helper to generate Vues computed methods for simple channel modes.
// Eg. +i, +n, etc
function generateComputedMode(mode) {
    return {
        get: function computedModeGet() {
            return this.modeVal(mode);
        },
        set: function computedModeSet(newVal) {
            return this.setMode((newVal ? '+' : '-') + mode);
        },
    };
}

function generateComputedBufferSettings(setting) {
    return {
        get() {
            return this.buffer.setting(setting);
        },
        set(newVal) {
            return this.buffer.setting(setting, newVal);
        },
    };
}

export default {
    props: ['buffer'],
    data() {
        return {
            textViewTopic: this.buffer.topic || '',
            textFieldPassword: this.modeVal('k') || '',
        };
    },
    computed: {
        modeM: generateComputedMode('m'),
        modeI: generateComputedMode('i'),
        modeT: generateComputedMode('t'),
        modeN: generateComputedMode('n'),
        settingShowJoinParts: generateComputedBufferSettings('show_joinparts'),
        settingShowTopics: generateComputedBufferSettings('show_topics'),
        settingShowNickChanges: generateComputedBufferSettings('show_nick_changes'),
        topicSynced() {
            const realTopic = this.buffer.topic;
            return this.textViewTopic === realTopic;
        },
        passwordSynced() {
            const realPassword = this.modeVal('k') || '';
            return this.textFieldPassword === realPassword;
        },
    },
    methods: {
        updateTopic() {
            const newTopic = this.textViewTopic.replace('\n', ' ');

            if (!newTopic.trim()) {
                this.buffer
                    .getNetwork()
                    .ircClient.raw(`TOPIC ${this.buffer.name} :`);
            } else {
                this.buffer
                    .getNetwork()
                    .ircClient.setTopic(this.buffer.name, newTopic);
            }
        },
        updatePassword() {
            if (this.textFieldPassword.length === 0) {
                this.setMode('-k', this.modeVal('k'));
                return;
            }

            this.setMode('+k', this.textFieldPassword);
        },
        updateBanList: function updateBanList() {
            this.buffer
                .getNetwork()
                .ircClient.raw('MODE', this.buffer.name, '+b');
        },
        setMode: function setMode(mode, param) {
            this.buffer
                .getNetwork()
                .ircClient.raw('MODE', this.buffer.name, mode, param);
        },
        modeVal: function modeVal(mode) {
            let val = false;

            if (typeof this.buffer.modes[mode] === 'undefined') {
                // Specifically undefined = mode not set
                val = false;
            } else if (!this.buffer.modes[mode]) {
                // Falsy value = mode set without value
                val = true;
            } else {
                // Anything else = mode set with a value
                val = this.buffer.modes[mode];
            }

            return val;
        },
        areWeAnOp: function areWeAnOp() {
            return this.buffer.isUserAnOp(this.buffer.getNetwork().nick);
        },
    },
};
</script>

<style>
/* Channel Settings */
text-view.channel-settings-topic,
text-field.channel-settings-password {
    border-width: 2;
    border-radius: 10;
    color: var(--default-fg);
    border-color: var(--warning4);
    background-color: var(--input-bg);
    padding: 7;
    line-height: 1;
}

text-view.channel-settings-topic.synced,
text-field.channel-settings-password.synced {
    border-color: var(--accent3);
}
.label {
    text-wrap: true;
}
</style>
