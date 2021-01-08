<template>
    <page
        actionBarHidden="true"
        class="app-page"
        @loaded="loaded"
        @unloaded="unloaded"
        @navigatingTo="navigatingTo"
    >
        <component
            :is="mainPage"
            :visibility="false ? 'collapsed' : 'visible'"
        />
    </page>
</template>

<script>
'kiwi public';

import _ from 'lodash';
import { alert, confirm } from '@nativescript/core/ui/dialogs';
import { LoadingIndicator, Mode } from '@nstudio/nativescript-loading-indicator';
import Logger from '@/libs/Logger';
import { updateConfig } from '@mobile/libs/initialiser';
import { joinChannels } from '@mobile/libs/utils/channel';

import NickList from './NickList';
import StateBrowser from './StateBrowser';
import Welcome from './Welcome';
import LoaderPage from './startups/LoaderPage';
import UserBox from './UserBox';
import ChannelPage from './ChannelPage';
import QueryPage from './QueryPage';
import ServerPage from './ServerPage';
import UserSettings from './UserSettings';
import AppSettings from './AppSettings';
import AddChatPage from './AddChatPage';

const log = Logger.namespace('App');

export default {
    components: { StateBrowser, NickList, Welcome },
    data() {
        return {
            firstLoad: true,
        };
    },
    computed: {
        network() {
            if (this.$state.networks.length === 1) {
                return this.$state.networks[0];
            }
            return this.$state.getActiveNetwork();
        },
        buffer() {
            return this.$state.getActiveBuffer();
        },
        immediateNavigation() {
            return !!(this.firstLoad && this.buffer);
        },
        hasNetworks() {
            return (
                this.$state.networks.filter((network) => !network.hidden)
                    .length > 0
            );
        },
        mainPage() {
            if (!this.hasNetworks) {
                return Welcome;
            }

            return StateBrowser;
        },
    },
    mounted() {
        log('APP MOUNTED!!!');
    },
    created() {
        log('APP CREATED!!!');
        this.firstLoad = true;

        this.listen(this.$state, 'logOut', this.logOut);
        this.listen(this.$state, 'network.connect', this.connectNetwork);

        const debouceBufferChange = _.debounce(() => this.navigateToBuffer(this.buffer), 0);
        // Both these watchers could change in the same tick so using debounce to only call
        // navigate once
        this.$state.$watch('ui.active_network', (bufferName) => {
            debouceBufferChange();
        });
        this.$state.$watch('ui.active_buffer', (bufferName) => {
            debouceBufferChange();
        });

        this.listen(this.$state, 'open.buffer', (buffer) => {
            this.$state.setActiveBuffer(buffer.networkid, buffer.name);
        });

        this.listen(this.$state, 'join.network-and-buffer', async(bufferData) => {
            await this.joinBuffer(bufferData);
        });

        this.listen(this.$state, 'userbox.show', (user, props) => {
            this.$navigateTo(UserBox, {
                props: {
                    network: this.network,
                    buffer: this.buffer,
                    user: user,
                    ...props,
                },
                backstackVisible: false,
            });
        });

        this.listen(this.$state, 'user-settings.show', (props) => {
            this.$navigateTo(UserSettings, { backstackVisible: false, props });
        });

        this.listen(this.$state, 'app-settings.show', () => {
            this.openAppSettings();
        });

        this.listen(this.$state, 'join-channel.show', (props) => {
            this.$navigateTo(AddChatPage, {
                props: {
                    network: this.network,
                    ...props,
                },
            });
        });

        this.listen(this.$state, 'server.open', (props) => {
            this.$navigateTo(ServerPage, {
                props: props,
            });
        });

        this.listen(this.$state, 'server.create', () => {
            this.addEmptyNetwork();
        });

        this.listen(this.$state, 'app.resumed', () => {
            console.log('APP RESUMED');
            this.firstLoad = true;
            setTimeout(() => {
                this.setBufferOnStart(this.$state);
            }, 50);
        });

        setTimeout(() => {
            this.setBufferOnStart(this.$state);
        }, 50);

        log('APP CREATED DONE!');

        // function perfTimer(label) {
        //     let start = 0;
        //     let last = 0;
        //     let marks = [];

        //     let ret = {
        //         marks,
        //         mark: function(markLabel) {
        //             let now = performance.now();
        //             marks.push({label: label + '-' + markLabel, len: now-last});
        //             last = now;
        //         },
        //         fork: function(forkLabel) {
        //             let t = perfTimer(label + ' > ' + forkLabel);
        //             marks.push(t);
        //             return t;
        //         },
        //         end: function() {
        //             let end = performance.now();
        //             marks.push({label: label + '-end', len: end-start});
        //         },
        //         log: function() {
        //             for(let i=0; i<marks.length; i++) {
        //                 let m = marks[i];
        //                 if (m.mark) {
        //                     m.log();
        //                 } else {
        //                     console.log(`[perf ${m.label}] ${m.len}ms`);
        //                 }
        //             }
        //         },
        //     };

        //     start = last = performance.now();
        //     // ret.mark('start');
        //     return ret;
        // }

        // function wrapPerfFn(fn) {
        //     return function wrappedPerfFn() {
        //         let t = perfTimer(fn.name || 'wrappedPerfFn');
        //         let ret = fn.apply(this, Array.prototype.slice.call(arguments, 0));
        //         t.end();
        //         t.log();
        //         return ret;
        //     };
        // }

        // function wrapAllFnsInObj(obj) {
        //     for(let fnName in obj) {
        //         if (typeof obj[fnName] === 'function') {
        //             obj[fnName] = wrapPerfFn(obj[fnName]);
        //         }
        //     }
        // }

        // wrapAllFnsInObj(this.$state);
    },
    destroyed() {
        log('APP DESTROYED!!!');
    },
    methods: {
        logOut() {
            this.$navigateTo(LoaderPage, {
                clearHistory: true,
                props: {
                    doLogout: true,
                },
            });
        },
        navigateToBuffer(buffer) {
            log(`navigating to: ${buffer && buffer.name}`);

            if (!buffer) {
                const frame = this.$el.nativeView?.frame;
                const topPage = frame?.backStack[0];
                if (topPage) {
                    frame.goBack(topPage);
                }
                return;
            }

            const navigationOptions = {};
            if (this.immediateNavigation) {
                navigationOptions.transition = { name: 'fade', duration: 0 };
            }

            this.$state.setting('open_buffer_on_start', {
                networkid: _.get(
                    buffer.getNetwork(),
                    'connection.bncnetid',
                    ''
                ),
                buffername: buffer.name,
            });

            // if app is already on this buffer page, don't navigate again
            if (this.isPresentingBufferPage(buffer)) {
                return;
            }

            if (buffer.isChannel()) {
                this.$navigateTo(ChannelPage, {
                    ...navigationOptions,
                    props: {
                        buffer: buffer,
                    },
                });
                return;
            }

            if (buffer.isQuery() || buffer.isSpecial()) {
                this.$navigateTo(QueryPage, {
                    ...navigationOptions,
                    props: {
                        buffer: buffer,
                    },
                });
            }
        },
        connectNetwork(network) {
            return new Promise((resolve, reject) => {
                let onRegistered = () => {
                    log.info('onRegistered!!!!!: ' + network.connection.server);
                    network.ircClient.off('registered', onRegistered);
                    network.ircClient.off('close', onClosed);
                    resolve();
                };
                let onClosed = (e) => {
                    log.info('onClosed!!!!!: ' + network.connection.server);

                    // Invalid password
                    if (network.last_error === "Invalid password") {
                        alert({
                            title: this.$t('disconnected'),
                            message: this.$t('err_invalid_password_logout'),
                            okButtonText: this.$t('OK'),
                        }).then(() => {
                            this.logOut();
                        });
                        return;
                    }
                    
                    alert({
                        title: this.$t('disconnected'),
                        message: this.$t('connection_error', {
                            network: network.name,
                        }),
                        okButtonText: this.$t('OK'),
                    });
                    network.ircClient.off('registered', onRegistered);
                    network.ircClient.off('close', onClosed);
                    reject();
                };
                network.ircClient.once('registered', onRegistered);
                network.ircClient.once('close', onClosed);

                updateConfig()
                    .then(network.ircClient.connect)
                    .catch(() => {
                        onClosed();
                    });
            });
        },
        openAppSettings() {
            this.$navigateTo(AppSettings, {});
        },
        addEmptyNetwork() {
            let nick = 'Guest' + Math.floor(Math.random() * 100);
            let network = this.$state.addNetwork('Network', nick, {});
            network.connection.direct = true;
            network.connection.tls = false;
            this.$navigateTo(ServerPage, {
                props: {
                    network: network,
                    openTab: 'settings',
                    isNew: true,
                },
            });
        },
        loaded() {
            console.log('APP LOADED!!!');
            this.firstLoad = false;
        },
        unloaded() {
            console.log('APP UNLOADED!!!');
        },
        navigatingTo(event) {
            if (event.isBackNavigation) {
                this.$state.setting('open_buffer_on_start', null);
                this.$state.setActiveBuffer(false);
            }
        },
        isPresentingBufferPage(buffer) {
            const currentPage = this.$el.nativeView.frame.currentPage;

            return (
                currentPage.networkid === buffer.networkid &&
                currentPage.buffername === buffer.name
            );
        },
        ensureBncConnection() {
            const bncNetwork = this.$state.networks.find(
                (network) => network.is_bnc
            );

            return new Promise((resolve, reject) => {
                if (!bncNetwork) {
                    reject();
                }

                if (bncNetwork.state !== 'disconnected') {
                    resolve();
                    return;
                }

                this.$state.$once('irc.bouncer networks', () => {
                    resolve();
                });

                this.connectNetwork(bncNetwork);
            });
        },
        async setBufferOnStart() {
            let openBufferOnStart = this.$state.setting('open_buffer_on_start');

            this.joinBuffer(openBufferOnStart);

            // clean the open_buffer_on_start so this doesn't run again.
            this.$state.setting('open_buffer_on_start', null);
        },
        async joinBuffer(bufferData) {
            if (
                !bufferData ||
                !(
                    bufferData.networkid ||
                    bufferData.network.server
                ) ||
                !bufferData.buffername
            ) {
                return;
            }

            // the network can be a bnc network ID or an address
            let network = null;
            if (bufferData.networkid) {
                network = this.$state.getNetworkFromBncNetId(
                    bufferData.networkid
                );
            } else if (bufferData.network.server) {
                network = this.$state.getNetworkFromAddress(
                    bufferData.network.server
                );
            }

            this.indicator = this.indicator || new LoadingIndicator();

            // if network is not found, ask to create it
            if (!network) {
                // if there is not enough data to create the new network, do nothing
                if (
                    !bufferData.network.server ||
                    !bufferData.network.name ||
                    !bufferData.network.port ||
                    !bufferData.network.tls
                ) {
                    return;
                }

                const result = await confirm({
                    title: this.$t('confirm_add_network.title'),
                    message: this.$t('confirm_add_network.text'),
                    okButtonText: this.$t('yes'),
                    neutralButtonText: this.$t('no'),
                });

                if (!result) {
                    return;
                }

                this.indicator.show({
                    message: this.$t('auto_connect_messages.connect_bouncer'),
                    mode: Mode.Indeterminate,
                });

                await this.ensureBncConnection();

                // Add the new network
                network = this.$state.addNetwork(
                    bufferData.network.name,
                    null,
                    bufferData.network
                );
            }

            // connect to the network if not connected
            if (network.state === 'disconnected') {
                this.indicator.show({
                    message: this.$t(
                        'auto_connect_messages.connect_network',
                        { network: bufferData.network.name }
                    ),
                    mode: Mode.Indeterminate,
                });
                await this.connectNetwork(network);
            }

            this.indicator.hide();

            // add the buffers
            joinChannels(network, decodeURIComponent(bufferData.buffername));
        },
    },
};
</script>

<style lang="scss">
.appsettings-btn {
    vertical-align: top;
    horizontal-align: right;
    border-width: 0;
    background-color: transparent;
    padding: 8 0 5 0;
    width: 40;
    height: 35;
    color: var(--neutral4);
    margin-right: 10;
    font-size: 20;
    android-elevation: 0;
    android-dynamic-elevation-offset: 0;

    &:highlighted {
        animation-name: press;
        animation-duration: 0.2s;
        animation-fill-mode: forwards;
        animation-timing-function: ease;
    }
}

.statebrowser-tools {
    height: 35;
    width: 200;
    horizontal-align: left;
    vertical-align: top;
}

.statebrowser-tools > * {
    vertical-align: center;
    margin-right: 10;
}
</style>
