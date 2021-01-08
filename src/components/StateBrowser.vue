<template>
    <grid-layout
        rows="40 50 *"
        class="statebrowser-page"
    >
        <label
            class="statebrowser-header"
            rowSpan="2"
            iosOverflowSafeArea="true"
        />
        <button
            row="0"
            class="appsettings-btn fas"
            text=""
            @tap="openAppSettings"
        />
        <stack-layout
            orientation="horizontal"
            class="statebrowser-tools m-l-20"
        >
            <component
                :is="plugin.component"
                v-for="plugin in pluginUiElements"
                :key="plugin.id"
                v-bind="plugin.props"
            />
        </stack-layout>
        <label
            row="1"
            class="networks-title h1 pull-left m-l-20"
            :text="$t('networks')"
        />
        <button
            row="1"
            class="statebrowser-addnetwork-btn pull-right fas m-r-10"
            @tap="addEmptyNetwork"
        >
            <formatted-string><span>+</span></formatted-string>
        </button>
        <scroll-view
            class="statebrowser-scrollarea"
            row="2"
            padding="0"
            iosOverflowSafeArea="true"
        >
            <stack-layout>
                <state-browser-network
                    v-for="network in networksToShow"
                    :key="network.id"
                    :network="network"
                />
            </stack-layout>
        </scroll-view>
    </grid-layout>
</template>

<script>
'kiwi public';

import GlobalApi from '@mobile/libs/GlobalApi';
import * as Storage from '@mobile/libs/storage/AppSettings';
import StateBrowserNetwork from './StateBrowserNetwork';

export default {
    components: { StateBrowserNetwork },
    data() {
        return {
            pluginUiElements: GlobalApi.singleton().stateBrowserPlugins,
        };
    },
    computed: {
        networks() {
            return this.$state.networks;
        },
        networksToShow: function networksToShow() {
            return this.networks.filter(
                (network) => !network.hidden && network.name
            );
        },
        isPersistingState: function isPersistingState() {
            return !!this.$state.persistence;
        },
    },
    created() {
        this.listen(this.$state, 'app.suspended', () => {
            this.updateConnectedNetworksList();
        });
    },
    methods: {
        openAppSettings() {
            this.$state.$emit('app-settings.show');
        },
        addEmptyNetwork() {
            this.$state.$emit('server.create');
        },
        updateConnectedNetworksList() {
            const connectedNetworks = this.networksToShow
                .filter((network) => network.state !== 'disconnected')
                .map((network) => network.connection.bncnetid);

            Storage.set(
                'connected_networks',
                JSON.stringify(connectedNetworks)
            );
        },
    },
};
</script>

<style lang="scss" scoped>
.networks-title {
    vertical-align: bottom;
    margin-bottom: 5;
    height: 45;
    font-weight: normal;
    padding: 0;
}

.statebrowser-addnetwork-btn {
    border-width: 0;
    background-color: transparent;
    margin-bottom: 5;
    width: 40;
    height: 55;
    color: var(--primary5);
    vertical-align: bottom;
    font-size: 48;
    android-elevation: 0;
    android-dynamic-elevation-offset: 0;
    font-weight: normal;
    padding: 0 0 5 0;

    &:highlighted {
        animation-name: press;
        animation-duration: 0.2s;
        animation-fill-mode: forwards;
        animation-timing-function: ease;
    }
}

.statebrowser-header {
    background-color: var(--neutral2);
}
</style>
