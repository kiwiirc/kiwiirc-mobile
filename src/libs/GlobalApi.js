'kiwi public';

import Vue from 'nativescript-vue';
import _ from 'lodash';
import EventEmitter from 'eventemitter3';
import JSON5 from 'json5';
import * as appversion from 'nativescript-appversion';

import * as Misc from '@/helpers/Misc';
import Logger from '@/libs/Logger';

let singletonInstance = null;
let pluginsToInit = [];
let nextPluginId = 0;

export default class GlobalApi extends EventEmitter {
    constructor() {
        super();

        /* eslint-disable no-underscore-dangle */
        this.exports = global._kiwi_exports || {};
        
        // eslint-disable-next-line no-undef
        appversion.getVersionName().then(version => this.version = version);

        /** A reference to the internal Vuejs instance */
        this.Vue = Vue;
        /** Expose JSON5 so that plugins can use the same config format */
        this.JSON5 = JSON5;
        /** The applications internal state */
        this.state = null;

        this.controlInputToolPlugins = [];
        this.controlInputTopPlugins = [];
        this.stateBrowserPlugins = [];
        this.isReady = false;
    }

    static singleton() {
        singletonInstance = singletonInstance || new GlobalApi();
        return singletonInstance;
    }

    init() {
        this.isReady = true;
        this.initPlugins();
    }

    // Init any plugins that were added before we were ready
    initPlugins() {
        pluginsToInit.forEach((plugin) => this.initPlugin(plugin));
    }


    versionMatches(v) {
        return compareVersions(this.version, v) >= 0;
    }

    static recreate() {
        singletonInstance = null;
        singletonInstance = new GlobalApi();
        return singletonInstance;
    }

    /**
     * Register a plugin with kiwi
     *
     * Plugins being loaded at startup will be registered once Kiwi is ready. At any
     * other point the plugin will be registered instantly
     * @param {String} pluginName The name of this plugin
     * @param {Function} fn A callback function to start the plugin. function(kiwi, logger)
     */
    plugin(pluginName, fn) {
        let plugin = { name: pluginName, fn: fn };
        if (!pluginsToInit.some( p => p.name === plugin.name)) {
            pluginsToInit.push(plugin);
        }
        if (this.isReady) {
            this.initPlugin(plugin);
        }
    }

    async initPlugin(plugin) {
        let pluginLogger = Logger.namespace(`Plugin ${plugin.name}`);
        try {
            await plugin.fn(this, pluginLogger);
            this.state.$emit('plugin.loaded', {
                name: plugin.name,
            });
        } catch (err) {
            pluginLogger.error(err.stack);
        }
    }

    /**
     * Get a reference to an internal Kiwi module
     *
     * E.g. require('helpers/TextFormatting');
     * @param {String} mod The module path
     */
    require(modPath) {
        let path = modPath.replace(/\//g, '.');
        let mod = _.get(this.exports, path);

        if (typeof mod === 'undefined') {
            Logger.error('Module does not exist: ' + modPath);
        }

        return mod;
    }

    setState(state) {
        this.state = state;

        // Hacky, but since Vues emitter doesnt support 'all', hijack its $emit call
        // so that we can forward the event on to plugins
        let stateEmit = this.state.$emit;
        let thisEmit = this.emit;

        this.state.$emit = (...args) => {
            try {
                thisEmit.call(this, 'all', args[0], ...args.slice(1));
                thisEmit.call(this, ...args);
            } catch (err) {
                Logger.error(err.stack);
            }

            return stateEmit.call(this.state, ...args);
        };

        // Let plugins emit events into the internal state
        this.emit = (...args) => {
            stateEmit.call(this.state, ...args);
            thisEmit.call(this, ...args);
        };
    }

    /**
     * Add Vue component to different parts of the Kiwi UI
     * - addUi('input', component, props)
     * - addUi('browser', component, props)
     * @param {string} type Where this DOM element should be added
     * @param {object} component The Vue component to add
     * @param {object} props Optional props for this plugin
     */
    addUi(type, component, props = {}) {
        let plugin = {
            component: component,
            id: nextPluginId++,
            props,
        };

        switch (type) {
        case 'input_tool':
            this.controlInputToolPlugins.push(plugin);
            break;
        case 'input_top':
            this.controlInputTopPlugins.push(plugin);
            break;
        case 'browser':
            this.stateBrowserPlugins.push(plugin);
            break;
        default:
            break;
        }
    }

    /**
     * Add a custom startup screen that may be loaded by the configuration file
     * @param {String} name The name of this startup screen
     * @param {Object} startup object with `startup()` and `logout()` (optional) functions
     */
    addStartup(name, startup) {
        let startups = this.state.getStartups();
        startups[name] = startup;
    }

    /**
     *
     * @param {String} dest The module path to replace
     * @param {Object} source The new module to insert in place
     */
    replaceModule(dest, source) {
        let mod = this.require(dest);

        if (!mod) {
            console.error(`The module ${dest} does not exist`);
            throw new Error(`The module ${dest} does not exist`);
        }

        if (mod === source) {
            return;
        }

        Misc.replaceObjectProps(mod, source);
    }
}
