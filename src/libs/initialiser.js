import _ from 'lodash';
import Vue from 'nativescript-vue';

import URL from 'url-parse';
import {
    Application,
    Device,
    isIOS,
    Frame,
    ApplicationSettings
} from '@nativescript/core';
import { openUrl } from 'tns-core-modules/utils/utils';
import { alert } from '@nativescript/core/ui/dialogs';
import { connectionType, startMonitoring } from 'tns-core-modules/connectivity';
import * as appversion from 'nativescript-appversion';
import * as Sound from "nativescript-sound-kak";
import Themes from 'nativescript-themes';
import InAppBrowser from 'nativescript-inappbrowser';
import { getUniversalLink, registerUniversalLinkCallback } from 'nativescript-plugin-universal-links';

import i18next from 'i18next';

import { init as initStrftime } from '@mobile/libs/utils/lang';
import GlobalApi from '@mobile/libs/GlobalApi';
import getState from '@/libs/state';
import getBncLogin from '@mobile/libs/BncLogin';
import ConfigLoader from '@/libs/ConfigLoader';
import InputHandler from '@/libs/InputHandler';
import * as Misc from '@/helpers/Misc';
import Logger from '@/libs/Logger';
import StatePersistence from '@/libs/StatePersistence';
import * as Storage from '@mobile/libs/storage/AppSettings';
import { AudioManager } from '@/libs/AudioManager';
import ThemeManager from '@/libs/ThemeManager';
import { VibrationManager } from '@mobile/libs/VibrationManager';

import '@mobile/styles/scss/platforms/_index.scss';

const fs = require('tns-core-modules/file-system');
const FileSystemAccess = require('tns-core-modules/file-system/file-system-access')
    .FileSystemAccess;

require('nativescript-websockets');

const appPath = fs.knownFolders.currentApp().path + '/';

let api = (global.kiwi = GlobalApi.singleton());

const configCacheKey = 'config-cache';
const log = Logger.namespace('initialiser');

let initialised = false;
let keyboardDismissing = false;

let listeners = [];

let lastUpdate = 0;

export function initApp() {
    // Check if the app is already initialized, skips if it is.
    if (initialised) {
        log('already initialised.');
        return Promise.resolve(getState());
    }

    return updateConfig(false) // loads the config (see bellow)
        .then(initState) // load the persisted state, creates the $state mixin
        .then(initPlugins) // inits the plugin system and loads plugins
        .then(initLocales) // loads the needed localization files
        .then(initThemes) // loads the theme system
        .then(initUniversalLinks)
        .then(initInputCommands) // inits the input commands handler
        .then(initSuspendResumeWatcher) // creates listeners for suspend/resume events
        .then(initConnectionWatcher) // creates listeners for internet connection events
        .then(initIOSKeyboardWatcher) // creates listeners for iOS Keyboard events
        .then(initSound) // initializes sound and vibration
        .then(initMediaViewer) // initializes an in-app browser available to all the app
        .then(() => {
            initialised = true;
        })
        .then(() => getState());
}

export function resetApp() {
    // clear stored appSettings
    ApplicationSettings.clear();

    // clear listeners
    (listeners || []).forEach((fn) => fn());

    // reset state
    getState.recreate();

    getBncLogin.recreate();

    api = (global.kiwi = GlobalApi.recreate());

    initialised = false;
}

export async function updateConfig(needsStartupOptions = true) {
    // for more information on the config update flow, see docs/server_config_flow.md
    const updatedConfig = await getUpdatedConfig(needsStartupOptions);

    console.log('updatedConfig.startupScreen: ' + updatedConfig.startupScreen);

    if (needsStartupOptions && !updatedConfig.startupOptions) {
        log('StartupOptions not available after config update');
        throw new Error('Could not retrieve network settings.')
    }

    const configLoader = new ConfigLoader();
    const config = await configLoader.loadFromObj(updatedConfig);

    applyConfig(config);
}

async function getUpdatedConfig(needsStartupOptions) {
    const cachedConfig = await loadConfigFromCache();

    if (cachedConfig &&
        Date.now() - lastUpdate < 60 * 1000 &&
        (needsStartupOptions && cachedConfig.startupOptions)) {
        // will use cached config if there is a cachedConfig and
        // if cachedConfig is less than 1 minute old and
        // if has startupOptions when it's not the bootUpdate
        log.info('getUpdatedConfig returning cachedConfig');
        return cachedConfig;
    }

    const bundledConfig = getBundledConfig();
    const storedConfig = cachedConfig || bundledConfig

    if (!_.get(storedConfig, 'appSettings.configUrl')) {
        log.info('getUpdatedConfig no configUrl');
        return storedConfig;
    }

    try {
        // generate the url from the bundledConfig or state settings
        const url = await makeServerConfigUrl(storedConfig);

        const serverConfig = await requestConfig(url);
        const newConfig = _.merge(bundledConfig, serverConfig);
        log.info('newConfig: ' + JSON.stringify(newConfig));
        saveConfigToCache(newConfig);
        lastUpdate = Date.now();
        return newConfig;
    } catch(e) {
        log.error(e);
        return storedConfig;
    }
}

/**
 * Returns the config bundled in config.json
 */
function getBundledConfig() {
    const FSA = new FileSystemAccess();

    const configFileName = fs.path.join(appPath, 'assets/config.json');

    if (!FSA.fileExists(configFileName)) {
        throw new Error(`File ${configFileName} not found.`);
    }

    const file = fs.File.fromPath(configFileName);
    const configText = file.readTextSync();
    const initialConfig = JSON.parse(configText);
    Misc.dedotObject(initialConfig);

    return initialConfig;
}

async function requestConfig(configUrl) {
    const response = await fetch(configUrl);
    if (!response.ok) {
        log.info('invalid server config response: ' + response.status);
        throw new Error(response.status);
    }

    const json = await response.json();
    log.info('config from server: ' + JSON.stringify(json));
    Misc.dedotObject(json);
    return json;
}

async function makeServerConfigUrl(config) {
    const url = new URL(config.appSettings.configUrl, true);

    url.query.app = await appversion.getAppID();
    url.query.device = Device.uuid;
    url.query.cb = new Date().getTime();

    const state = getState();
    state.$emit('configUrl.create', { url });

    return url.toString();
}

function loadConfigFromCache() {
    if (!ApplicationSettings.hasKey(configCacheKey)) {
        return null;
    }

    try {
        log.info('loading config from cache.');
        return JSON.parse(ApplicationSettings.getString(configCacheKey));
    } catch (e) {
        log('error parsing config from cache: ' + e);
        ApplicationSettings.remove(configCacheKey);
    }

    return null;
}

function saveConfigToCache(config) {
    ApplicationSettings.setString(configCacheKey, JSON.stringify(config));
}

function applyConfig(config) {
    applyConfigObj(config, getState().settings);
}

function applyConfigObj(obj, target) {
    _.each(obj, (val, key) => {
        if (typeof val === 'object') {
            if (typeof target[key] !== 'object') {
                // Create the correct type of object
                let newVal = _.isArray(val) ? [] : {};

                Vue.set(target, key, newVal);
            }
            applyConfigObj(val, target[key]);
        } else {
            Vue.set(target, key, val);
        }
    });
}

async function initState() {
    const state = getState();
    let stateKey = state.settings.startupOptions.state_key;

    state.settings.useBufferHistory = false;

    // Default to a preset key if it wasn't set
    if (typeof stateKey === 'undefined') {
        stateKey = 'kiwi-state';
    }

    let persistLog = Logger.namespace('StatePersistence');
    let persist = new StatePersistence(
        stateKey || '',
        state,
        Storage,
        persistLog
    );

    // persist the buffers in the state by default
    let persistSetting = state.settings.startupOptions.remember_buffers;
    if (typeof persistSetting === 'undefined') {
        persist.includeBuffers = true;
    } else {
        persist.includeBuffers = !!persistSetting;
    }

    if (stateKey) {
        await persist.loadStateIfExists();
    }

    // Make the state available to all components by default
    Vue.mixin({
        computed: {
            $state() {
                return getState();
            },
        },
    });

    api.setState(state);
}

async function initPlugins() {
    const state = getState();
    const plugins = state.setting('plugins');

    for (let pluginDefinition of plugins) {
        if (typeof pluginDefinition === 'string') {
            pluginDefinition = {
                name: pluginDefinition,
                file: pluginDefinition,
            };
        }

        /* eslint-disable global-require */
        /* eslint-disable import/no-dynamic-require */
        const plugin = await import(
            /* webpackInclude: /ns-kiwi-plugin-/ */
            /* webpackExclude: /(\/assets\/|\/platforms\/)/ */
            `@app/../node_modules/${pluginDefinition.file}/index.js`);
        /* eslint-enable import/no-dynamic-require */
        /* eslint-enable global-require */

        if (typeof plugin.default === 'function') {
            await api.initPlugin({
                name: pluginDefinition.name,
                fn: plugin.default,
            });
        }
        log(`Initialised plugin: ${pluginDefinition.name}`);
    }
}

function initInputCommands() {
    /* eslint-disable no-new */
    new InputHandler(getState());
}

function initSound() {
    const sound = Sound.create(`${appPath}/assets/sounds/highlight.mp3`);

    const bleep = new AudioManager(sound);

    const state = getState();
    bleep.listen(state);
    bleep.watchForMessages(state);

    setTimeout(() => {
        const vibration = new VibrationManager();

        vibration.listen(state);
        vibration.watchForMessages(state);
    }, 5000);
}

function initThemes() {
    const state = getState();
    // TODO: move this logic to a ThemeManager
    ThemeManager.instance(state);

    const theme = state.settings.theme;
    const themeConfig = state.settings.themes.find(themeConf => themeConf.name === theme);
    console.log("Applying theme: ", themeConfig);
    Themes.applyTheme(themeConfig.url);
}

function initUniversalLinks() {
    const state = getState();
    // sets the universal link when booting the app
    const universalLink = getUniversalLink();
    if (universalLink) {
        state.setting('deepLink.url', universalLink);
    }

    // sets the universal link when resuming the app
    registerUniversalLinkCallback((resumeUniversalLink) => {
        if (resumeUniversalLink) {
            state.setting('deepLink.url', resumeUniversalLink);
        }
    });
}


function initConnectionWatcher() {
    const state = getState();
    startMonitoring((newConnectionType) => {
        if (newConnectionType === connectionType.none) {
            state.$emit('device.disconnected');
        } else {
            state.$emit('device.connected');
        }
    });
}

function initIOSKeyboardWatcher() {
    const state = getState();
    if (!isIOS) {
        return;
    }

    /* global
    UIKeyboardWillChangeFrameNotification
    UIKeyboardFrameEndUserInfoKey
    UIKeyboardWillHideNotification
    */
    Application.ios.addNotificationObserver(
        UIKeyboardWillChangeFrameNotification,
        (notification) => {
            const safeAreaInsetBottom = _.get(
                Frame.topmost(),
                'nativeView.safeAreaInsets.bottom',
                0
            );

            const keyboardHeight =
                notification.userInfo.valueForKey(UIKeyboardFrameEndUserInfoKey)
                    .CGRectValue.size.height
                - safeAreaInsetBottom;

            state.$emit('ui.ios.keyboardWillChangeFrame', {
                keyboardHeight: keyboardHeight,
                keyboardDismissing: keyboardDismissing,
            });
        }
    );

    Application.ios.addNotificationObserver(
        UIKeyboardWillHideNotification,
        (notification) => {
            keyboardDismissing = true;
            setTimeout(() => (keyboardDismissing = false), 200);
            state.$emit('ui.ios.keyboardWillHide');
        }
    );
}

function initSuspendResumeWatcher() {
    const state = getState();

    const appSuspended = () => {
        state.$emit('app.suspended');
    };
    const appResumed = () => {
        state.$emit('app.resumed');
    };
    Application.on(Application.suspendEvent, appSuspended);
    Application.on(Application.resumeEvent, appResumed);

    listeners.push(() => Application.off('suspend', appSuspended));
    listeners.push(() => Application.off('resume', appResumed));
}

function initMediaViewer() {
    const state = getState();

    const showMediaViewer = async (url) => {
        let beforeshowEvent = { url };
        state.$emit('mediaviewer.beforeshow', beforeshowEvent);

        if (beforeshowEvent.handled) {
            return;
        }

        try {
            if (await InAppBrowser.isAvailable()) {
                const result = await InAppBrowser.open(url, {
                    // iOS Properties
                    dismissButtonStyle: 'done',
                    preferredBarTintColor: '#0b68a2',
                    preferredControlTintColor: '#f1f4f8',
                    readerMode: false,
                    animated: true,
                    modalPresentationStyle: 'overFullScreen',
                    modalTransitionStyle: 'coverVertical',
                    modalEnabled: false,
                    // Android Properties
                    showTitle: true,
                    toolbarColor: '#0b68a2',
                    secondaryToolbarColor: '#0f2f41',
                    enableUrlBarHiding: true,
                    enableDefaultShare: true,
                    forceCloseOnRedirection: false,
                    // Specify full animation resource identifier(package:anim/name)
                    // or only resource name(in case of animation bundled with app).
                    animations: {
                        startEnter: 'slide_in_right',
                        startExit: 'slide_out_left',
                        endEnter: 'slide_in_left',
                        endExit: 'slide_out_right',
                    },
                });
                log('BROWSER RESULT: ' + JSON.stringify(result));
            } else {
                openUrl(url);
            }
        } catch (error) {
            InAppBrowser.close();
            await alert({
                title: 'Error',
                message: error.message || error,
                okButtonText: 'Ok',
            });
        }
    };
    state.$on('mediaviewer.show', showMediaViewer);

    listeners.push(() => state.$off('mediaviewer.show', showMediaViewer));
}

function initLocales() {
    // eslint-disable-next-line global-require
    const AvailableLocales = require('@/res/locales/available.json');
    const fallbackLocale = 'en-us';

    // Override the $t function so that empty translations fallback to en-us
    Vue.mixin({
        computed: {
            $t() {
                return (key, options) => {
                    let val = this.$i18n.i18next.t(
                        key,
                        options,
                        this.$i18n.i18nLoadedAt
                    );
                    if (!val) {
                        let opts = options || {};
                        opts.lng = 'en-us';
                        val = this.$i18n.i18next.t(
                            key,
                            opts,
                            this.$i18n.i18nLoadedAt
                        );
                    }
                    return val;
                };
            },
        },
    });

    // first, try using the device languages, then the fallback 'en-us'
    let preferredLangs = [Device.language.toLowerCase(), fallbackLocale];

    // our configs default lang overrides all others
    // let defaultLang = state.setting('language');
    // if (defaultLang) {
    //     preferredLangs.unshift(defaultLang);
    // }

    log.info('preferredLangs: ', preferredLangs);

    // set a default language
    i18next.changeLanguage('en-us');
    let foundLanguage = false;

    // Go through our browser languages until we find one that we support
    for (let idx = 0; idx < preferredLangs.length; idx++) {
        let lang = preferredLangs[idx];

        // if this is a language such as 'fr', add a following one of 'fr-fr' to cover
        // both cases
        if (lang.length === 2) {
            preferredLangs.splice(idx + 1, 0, lang + '-' + lang);
        }

        if (_.includes(AvailableLocales.locales, lang.toLowerCase())) {
            /* eslint-disable global-require */
            /* eslint-disable import/no-dynamic-require */
            i18next.addResourceBundle(
                lang,
                'translation',
                require('@mobile/assets/locales/' + lang + '.json')
            );
            log.info('adding: @mobile/assets/locales/' + lang + '.json');

            try {
                const mobileTranslation = require('@mobile/assets/mobile-locales/' +
                    lang +
                    '.json');
                i18next.addResourceBundle(
                    lang,
                    'translation',
                    mobileTranslation
                );
                log.info('adding: @mobile/assets/mobile-locales/' + lang + '.json');
            } catch (e) {
                log.info(
                    'could not add: @mobile/assets/locales/' + lang + '.json',
                    e
                );
            }
            /* eslint-enable import/no-dynamic-require */
            /* eslint-enable global-require */

            if (!foundLanguage) {
                i18next.changeLanguage(lang, (err, t) => {
                    if (err) {
                        // setting the language failed so set default again
                        i18next.changeLanguage('en-us');
                    } else {
                        foundLanguage = true;
                        initStrftime(lang);
                    }
                });
            }
        }
    }
}
