<template>
    <page
        actionBarHidden="true"
        class="loader-page loader-bg"
    >
        <grid-layout class="loader-page loader-bg" @loaded="startupApp">
            <activity-indicator class="startup-activity activity-indicator"
                                busy="true"
                                @loaded="animateActivityIndicator"
            />
        </grid-layout>
    </page>
</template>

<script>
'kiwi public';

import { alert } from '@nativescript/core/ui/dialogs';
import { AnimationCurve } from '@nativescript/core/ui/enums';

import Logger from '@/libs/Logger';
import App from '@mobile/components/App';
import LoaderErrorPage from './LoaderErrorPage';
import { initApp, resetApp } from '@mobile/libs/initialiser.js';

const log = Logger.namespace('Loader');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
    props: {
        doLogout: {
            type: Boolean,
            default: false,
        },
    },
    methods: {
        navigateToApp() {
            log('navigating to APP');
            this.$navigateTo(App, {
                transition: {
                    curve: 'easeInOut',
                    name: 'fade',
                },
                clearHistory: true,
            });
        },
        showStartupError(error) {
            log.error(`STARTUP ERROR: ${error}`);
            this.$navigateTo(LoaderErrorPage, {
                props: {
                    error: error,
                },
                transition: {
                    curve: 'easeInOut',
                    name: 'fade',
                },
                clearHistory: true,
            });
        },
        async startupApp() {
            log.info('startupApp!');

            if (this.doLogout) {
                try {
                    await logout(this.$state);
                } catch (e) {
                    log('Logout error: ' + e);
                    if (e.message.startsWith('Startup logout error')) {
                        await alert('Error logging out');
                        log('Dialog closed go back to app!: ' + e);
                        // if logout failed, go back to app!
                        this.navigateToApp();
                        return;
                    }

                    // something terrible happened.
                    await alert('Ups! Something terrible happened. Please close and re-open this app.');
                    return;
                }
            }

            const state = await initApp();
            log('app initialised! ');

            try {
                // get the startup module
                const startup = await getStartup(state);
                // and perform the startup
                const startupResult = await startup.startup(this, state);
                log('startup result: ' + startupResult);
            } catch (e) {
                this.showStartupError(`error loading startup: ${e}`);
                return;
            }

            state.persistence.watchStateForChanges();

            setInitialBuffer(state);

            try {
                this.navigateToApp();
            } catch (e) {
                let error;
                log.error(`error loading App: ${e}`);
                if (e) {
                    error = `Error starting Kiwi IRC: ${e}`;
                } else {
                    error = 'Unknown error starting Kiwi IRC';
                }

                this.showStartupError(error);
            }
        },
        animateActivityIndicator(event) {
            const view = event.object;
            view.opacity = 0;
            view.translateY = -40;
            view.animate({
                opacity: 1,
                duration: 500,
                translate: { x: 0, y: 0 },
                curve: AnimationCurve.easeIn,
            });
        },
    },
};

async function logout(state) {
    log.info('LOGGING OUT!');
    // TODO: instead of waiting 1s, we could create an AppMonitor so save the
    // App component state. This state would be changed on the App's created() and
    // destroyed(). Then, we would do `await AppMonitor.appDestroyed()`.
    await sleep(1000);

    const startup = await getStartup(state);

    if (typeof startup.logout === 'function') {
        try {
            await startup.logout();
        } catch (e) {
            log.error('Startup logout error: ' + e);
            throw new Error('Startup logout error');
        }
    }

    state.networks.forEach((network) => network.ircClient.quit('bye'));

    await state.persistence.forgetState();

    resetApp();
}

function getStartup(state) {
    // Decide which startup screen to use depending on the config
    const startupName = state.settings.startupScreen || 'none';

    const startupScreens = {
        bouncer: () => import(/* webpackChunkName: "bouncer" */ './Bouncer'),
        none: () => import(/* webpackChunkName: "noneStarter" */ './None'),
    };
    // startup screens from plugins
    let extraStartupScreens = state.getStartups();

    const startup =
        extraStartupScreens[startupName] ||
        (startupScreens[startupName] && startupScreens[startupName]());

    if (!startup) {
        throw new Error(`Startup ${startupName} not found!`);
    }
    return startup;
}

function setInitialBuffer(state) {
    const firstLogin = !state.setting('did_login');
    let openBufferOnStart;

    if (!firstLogin) {
        return;
    }

    // get the initial buffer from the config
    const options = state.settings.startupOptions;
    openBufferOnStart = {
        networkid: '',
        network: options.server,
        buffername: options.channel,
    };

    state.setting('did_login', true);
    state.setting('open_buffer_on_start', openBufferOnStart);
}
</script>

<style lang="scss">
.loader-bg {
    background-image: url('res://loaderbg');
    background-size: cover;
    background-position: center center;
}

.loader-page {
    .startup-activity.activity-indicator {
        visibility: visible;
        opacity: 0;
        width: 50;
        height: 50;
        color: var(--neutral1);
    }
}
</style>
