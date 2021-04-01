<template>
    <scroll-view>
        <stack-layout class="appsettings-general form">
            <dock-layout class="p-x-20 p-y-15">
                <kiwi-dropdown
                    v-model="theme"
                    dock="right"
                    width="150"
                    :options="['default']"
                />
                <label class="label" :text="$t('settings_theme')" />
            </dock-layout>

            <label
                class="form-section-header p-x-20"
                :text="$t('settings_messages_title')"
            />
            <dock-layout class="p-x-20 p-y-15">
                <switch v-model="timestamps_24h" dock="right" class="switch" />
                <label class="label" :text="$t('settings_24hour_timestamps')" />
            </dock-layout>
            <label class="divider" />
            <dock-layout class="p-x-20 p-y-15">
                <switch
                    v-model="settingBufferBlockPms"
                    dock="right"
                    class="switch"
                />
                <label class="label" :text="$t('settings_block_private')" />
            </dock-layout>

            <label
                class="form-section-header p-x-20"
                :text="$t('notifications')"
            />
            <dock-layout class="p-x-20 p-y-15">
                <switch
                    v-model="settingBufferTrafficAsActivity"
                    dock="right"
                    class="switch"
                />
                <label
                    class="label"
                    textWrap="true"
                    :text="$t('settings_show_joinpart')"
                />
            </dock-layout>
            <label class="divider" />
            <dock-layout class="p-x-20 p-y-15">
                <switch
                    v-model="settingBufferMuteSound"
                    dock="right"
                    class="switch"
                />
                <label class="label" :text="$t('settings_mute_sound')" />
            </dock-layout>

            <label class="form-section-header p-x-20" text="BNC" />
            <dock-layout class="p-x-20 p-t-10 p-b-15">
                <button
                    dock="right"
                    class="btn fas btn-danger btn-icon"
                    @tap="forget"
                >
                    <formatted-string><span></span></formatted-string>
                </button>
                <label
                    class="label "
                    :text="$t('log_out')"
                />
            </dock-layout>
            <label class="form-section-header p-x-20" :text="$t('about')" />
            <dock-layout class="p-x-20 p-y-15">
                <label ref="build-info-value"
                       dock="right"
                       class="body "
                       :text="buildInfo"
                />
                <label class="label" :text="$t('build_version')" @doubleTap="showDeviceId" />
            </dock-layout>
            <grid-layout columns="auto *" v-show="deviceIdVisible" class="p-x-20 p-y-15">
                <label col="0"
                       class="label"
                       :text="$t('device_id')"
                />
                <label ref="device-id-value"
                       col="1"
                       class="body"
                       :text="deviceId"
                />
            </grid-layout>
        </stack-layout>
    </scroll-view>
</template>

<script>
'kiwi public';

import { Device, GestureTypes } from '@nativescript/core';
import { confirm } from '@nativescript/core/ui/dialogs';
import * as appversion from '@nativescript/appversion';
import { Toasty } from '@triniwiz/nativescript-toasty';

import { addCellHighlight } from '@mobile/components/commons/animations';

const clipboard = require('nativescript-clipboard');

/**
 * Returns an object for a vuejs computated property on a state settings value
 * This allows default settings from the server config, but overrides with user config
 */
function bindSetting(settingName) {
    return {
        get: function settingGetter() {
            return this.$state.setting(settingName);
        },
        set: function settingSetter(newVal) {
            this.$state.setting(settingName, newVal);
        },
    };
}

export default {
    data() {
        return {
            buildInfo: '',
            theme: 'default',
            deviceIdVisible: false,
        };
    },
    computed: {
        timestamps_24h: {
            get: function get24Timestamps() {
                // %H is 24 hour format
                return (
                    this.$state
                        .setting('buffers.timestamp_format')
                        .substr(0, 2) === '%H'
                );
            },
            set: function set24Timestamps(newVal) {
                let newFormat = newVal ? '%H:%M:%S' : '%l:%M:%S %p';
                this.$state.setting('buffers.timestamp_format', newFormat);
            },
        },
        settingBufferBlockPms: bindSetting('buffers.block_pms'),
        settingBufferShareTyping: bindSetting('buffers.share_typing'),
        settingBufferTrafficAsActivity: bindSetting(
            'buffers.traffic_as_activity'
        ),
        settingBufferMuteSound: bindSetting('buffers.mute_sound'),
    },
    created() {
        this.deviceId = Device.uuid;
        setTimeout(async() => {
            const versionName = await appversion.getVersionName();
            const versionCode = await appversion.getVersionCode();
            this.buildInfo = `${versionName}(${versionCode})`;
        });
    },
    methods: {
        forget() {
            confirm(this.$t('confirm_logout')).then((result) => {
                if (result) {
                    this.$state.$emit('logOut');
                }
            });
        },
        showDeviceId() {
            if (this.deviceIdVisible) {
                return;
            }

            this.deviceIdVisible = true;

            this.enableCopy(this.$refs['build-info-value'].nativeView);
            this.enableCopy(this.$refs['device-id-value'].nativeView);
        },
        enableCopy(view) {
            addCellHighlight(view);

            view.on(GestureTypes.longPress, (e) => {
                if (e.state !== 1) {
                    return;
                }

                clipboard.setText(view.text).then(() => {
                    new Toasty({
                        text: this.$t('copied_clipboard'),
                    }).show();
                });
            });
        },
    },
};
</script>

<style>
.appsettings-general label.body {
    text-wrap: true;
    margin-left: 20;
    line-height: 5;
    text-align: right;
}
</style>
