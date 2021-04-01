<template>
    <page>
        <basic-action-bar
            :windowTitle="buffer.name + ' - ' + $t('notifications')"
        />
        <scroll-view>
            <stack-layout class="buffersettings">
                <grid-layout
                    columns="*, auto, auto, 20"
                    rows="auto, 30, 30, 30"
                    class="p-t-25 p-b-15"
                >
                    <label
                        col="0"
                        row="0"
                        colSpan="3"
                        verticalAlignment="top"
                        class="label p-x-20"
                        :text="$t('settings_notify')"
                    />
                    <label
                        col="1"
                        row="1"
                        verticalAlignment="center"
                        class="label-value p-r-10"
                        :class="{ selected: settingAlertOn === 'message' }"
                        :text="$t('settings_notify_all')"
                        @tap="settingAlertOn = 'message'"
                    />

                    <check-box
                        col="2"
                        row="1"
                        verticalAlignment="center"
                        class="radio-button"
                        boxType="circle"
                        fillColor="#2bafec"
                        ios:tint="#2bafec"
                        ios:tintColor="#2bafec"
                        onTintColor="white"
                        onCheckColor="white"
                        :checked="settingAlertOn === 'message'"
                        @checkedChange="
                            $event.value ? (settingAlertOn = 'message') : false
                        "
                    />

                    <label
                        col="1"
                        row="2"
                        verticalAlignment="center"
                        class="label-value p-r-10"
                        :class="{
                            selected: settingAlertOn === 'highlight',
                        }"
                        :text="$t('settings_notify_mentioned')"
                        @tap="settingAlertOn = 'highlight'"
                    />
                    <check-box
                        col="2"
                        row="2"
                        verticalAlignment="center"
                        class="radio-button"
                        fillColor="#2bafec"
                        ios:tint="#2bafec"
                        ios:tintColor="#2bafec"
                        onTintColor="white"
                        onCheckColor="white"
                        boxType="circle"
                        :checked="settingAlertOn === 'highlight'"
                        @checkedChange="
                            $event.value
                                ? (settingAlertOn = 'highlight')
                                : false
                        "
                    />
                    <label
                        col="1"
                        row="3"
                        verticalAlignment="center"
                        class="label-value p-r-10"
                        :class="{ selected: settingAlertOn === 'never' }"
                        :text="$t('settings_notify_never')"
                        @tap="settingAlertOn = 'never'"
                    />
                    <check-box
                        col="2"
                        row="3"
                        class="radio-button"
                        verticalAlignment="center"
                        boxType="circle"
                        fillColor="#2bafec"
                        ios:tint="#2bafec"
                        ios:tintColor="#2bafec"
                        onTintColor="white"
                        onCheckColor="white"
                        :checked="settingAlertOn === 'never'"
                        @checkedChange="
                            $event.value ? (settingAlertOn = 'never') : false
                        "
                    />
                </grid-layout>
                <label class="divider" />
                <dock-layout class="p-x-20 p-t-15 p-b-15">
                    <switch
                        dock="right"
                        class="switch"
                        v-model="settingMuteSound"
                    />
                    <label class="label" :text="$t('settings_notify_mute')" />
                </dock-layout>
                <label class="divider" />
            </stack-layout>
        </scroll-view>
    </page>
</template>

<script>
'kiwi public';

import { Device } from '@nativescript/core';

export default {
    props: ['buffer'],
    computed: {
        settingAlertOn: {
            get: function getSettingAlertOn() {
                return this.buffer.setting('alert_on');
            },
            set: function setSettingAlertOn(val) {
                const network = this.buffer.getNetwork();

                const netId = network.connection.bncnetid;
                if (netId) {
                    // If this buffer is on a BOUNCER account, update the setting there too
                    const bufferName = this.buffer.name;
                    network.ircClient.raw(
                        `BOUNCER changebuffer ${netId} ${bufferName} push_device_uuid=${Device.uuid};notify=${val}`
                    );
                }

                return this.buffer.setting('alert_on', val);
            },
        },
        settingMuteSound: {
            get: function getSettingAlertOn() {
                return this.buffer.setting('mute_sound');
            },
            set: function setSettingAlertOn(val) {
                return this.buffer.setting('mute_sound', val);
            },
        },
        settingHideMessageCount: {
            get: function getsettingHideMessageCount() {
                return this.buffer.setting('hide_message_counts');
            },
            set: function setsettingHideMessageCount(val) {
                return this.buffer.setting('hide_message_counts', val);
            },
        },
    },
};
</script>
