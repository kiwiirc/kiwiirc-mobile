import _ from 'lodash';

import getState from '@/libs/state';
import Logger from '@/libs/Logger';
import BouncerProvider from '@/libs/BouncerProvider';
import { updateConfig } from '@mobile/libs/initialiser';

const log = Logger.namespace('BncLogin');

let instance = null;
function singleton() {
    instance = instance || createNewBncLogin();
    return instance;
}

singleton.create = function createState() {
    return createNewBncLogin();
};

singleton.recreate = function recreateState() {
    instance = createNewBncLogin();
    return instance;
};

export default singleton;

function createNewBncLogin() {
    return new BncLogin();
}

class BncLogin {
    constructor() {
        log('BbncLogin ctor');

        this.bouncer = null;

        this.log = log;
    }

    prepare() {
        this.state = getState();

        // Used to update the Bouncer in case the Bouncer config changes while the app was in the
        // background.
        // (see docs/server_config_flow.md)
        // We are listening the 'network.connecting' event before constructing BouncerProvider
        // because we need our 'network.connecting' handler to execute before BouncerProvider's
        // 'network.connecting' handler. This way, we can update the network connection info before
        // the BouncerProvider uses it.
        this.initBncCommands();

        this.options = this.state.settings.startupOptions;

        this.log(
            `server: ${this.options.server} ${this.options.port} ${this.options.tls}`
        );
        this.bouncer = new BouncerProvider(this.state);
        this.bouncer.enable(
            this.options.server,
            this.options.port,
            this.options.tls,
            this.options.direct,
            this.options.direct_path
        );
    }

    async login(username, password) {
        this.log('login starting!', username, password);
        try {
            await updateConfig();
        } catch (e) {
            return Promise.reject();
        }

        this.prepare();

        const netAddress = _.trim(this.options.server);

        let netPassword = password;
        if (this.options.bouncer) {
            netPassword = `${username}:${password}`;
        }

        this.bouncer.bnc.password = '';

        return new Promise((resolve, reject) => {
            // If the network doesn't already exist, add a new one
            // this.state.getNetworkFromAddress(netAddress) ||
            // If the network doesn't already exist, add a new one
            let net =
                this.state.getNetworkFromAddress(netAddress) ||
                this.state.addNetwork('Network', username, {
                    server: netAddress,
                    port: this.options.port,
                    tls: this.options.tls,
                    password: netPassword,
                    encoding: _.trim(this.options.encoding),
                    direct: !!this.options.direct,
                    path: this.options.direct_path || '',
                    gecos: this.options.gecos,
                });

            // If we retreived an existing network, update the nick+password with what
            // the user has just put in place
            net.connection.nick = username;
            net.connection.password = netPassword;

            net.ircClient.on('raw.ERROR', (event) => {
                this.log('raw.ERROR', event);
            });

            net.ircClient.on('raw.*', (event) => {
                this.log('raw', event);
            });

            net.ircClient.on('error', (event) => {
                this.log('error', event);
            });
            net.ircClient.on('ERROR', (event) => {
                this.log('ERROR', event);
            });

            let onRegistered = () => {
                net.ircClient.off('motd', onRegistered);
                net.ircClient.off('close', onClosed);
                resolve();
            };
            let onClosed = (event) => {
                net.ircClient.off('raw', logger);
                net.ircClient.off('motd', onRegistered);
                net.ircClient.off('close', onClosed);

                if (net.last_error === 'Invalid password') {
                    reject('err_invalid_login');
                } else {
                    reject('err_connection_error');
                }
            };

            let logger = (event) => {
                console.log((event.from_server ? '[S] ' : '[C] ') + event.line);
            };

            net.ircClient.on('raw', logger);
            net.ircClient.once('motd', onRegistered);
            net.ircClient.once('close', onClosed);

            net.ircClient.connect();
        });
    }

    initBncCommands() {
        this.state.$on('network.connecting', () => {
            // update bouncer options
            this.options = this.state.settings.startupOptions;

            this.bouncer.bnc.server = this.options.server;
            this.bouncer.bnc.port = this.options.port;
            this.bouncer.bnc.tls = this.options.tls;
            this.bouncer.bnc.direct = this.options.direct;
            this.bouncer.bnc.path = this.options.direct_path;
        });
    }
}
