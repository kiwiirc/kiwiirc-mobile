<template>
    <grid-layout rows="40 * auto auto 500 * auto">
        <button
            row="0"
            class="appsettings-btn fas"
            text=""
            @tap="openAppSettings"
        />
        <label
            row="2"
            :text="$t('personal_client')"
            class="h1 text-center m-x-20"
            textWrap="true"
        />
        <label
            row="3"
            :text="$t('personal_addjoin') + '\n' + $t('personal_return')"
            class="label text-center m-x-20"
            textWrap="true"
        />

        <button
            row="6"
            class="welcome-newnetwork btn btn-accent m-10"
            @tap="addEmptyNetwork"
        >
            <formatted-string>
                <span class="fas" text=" " />
                <span :text="$t('add_network')" />
            </formatted-string>
        </button>
    </grid-layout>
</template>

<script>

export default {
    data() {
        return {
            nick: '',
            password: '',
            network: null,
        };
    },
    methods: {
        openAppSettings() {
            this.$state.$emit('app-settings.show');
        },
        addEmptyNetwork() {
            this.$state.$emit('server.create');
        },
    },
};
</script>
