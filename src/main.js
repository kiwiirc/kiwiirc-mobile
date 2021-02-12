import Vue from 'nativescript-vue';
// import VueDevtools from 'nativescript-vue-devtools';

import { isIOS, isAndroid, Application, Profiling } from '@nativescript/core';

import i18next from 'i18next';
import VueI18Next from '@panter/vue-i18next';

import Logger from '@/libs/Logger';

// global components
import RadSideDrawer from 'nativescript-ui-sidedrawer/vue';
import LoaderPage from '@mobile/components/startups/LoaderPage';

import AwayStatusIndicator from '@mobile/components/AwayStatusIndicator';
import Avatar from '@mobile/components/Avatar';
import FormattedMessage from '@mobile/components/FormattedMessage';
import MessageListMessage from '@mobile/components/MessageListMessage';
import MessageListUrlPreview from '@mobile/components/MessageListUrlPreview';
import BufferActionBar from '@mobile/components/BufferActionBar';
import BasicActionBar from '@mobile/components/BasicActionBar';
import IconTextField from '@mobile/components/commons/IconTextField';
import KiwiDropdown from '@mobile/components/commons/KiwiDropdown';
import * as PageKeyboardManager from '@mobile/components/commons/PageKeyboardManager';
import { addTouchPop, addCellHighlight } from '@mobile/components/commons/animations';

const log = Logger.namespace('main');

// in production, do not log to console.
if (TNS_ENV === 'production') {
    console.log = () => { };
} else {
    Logger.setLevel(2);
    // Vue.mixin({
    //     beforeUpdate() {
    //         console.log(this.$vnode.tag + ' start');
    //         // profiling.start('messagelist-update');
    //     },
    //     updated() {
    //         console.log(this.$vnode.tag + ' stop');
    //         // profiling.stop('messagelist-update');
    //     },
    // });

    // // add `@profiling.profile` decorator to suspected functions to monitor them
    // Profiling.enable();
    // setInterval(Profiling.dumpProfiles, 10000);
}

Vue.config.performance = true;

// Add a handy this.listen() fn to Vue instances. Saves on the need to add an event listener
// and then manually remove them all the time.
Vue.mixin({
    beforeDestroy: function beforeDestroy() {
        (this.listeningEvents || []).forEach((fn) => fn());
    },
    methods: {
        listen: function listen(source, event, fn) {
            this.listeningEvents = this.listeningEvents || [];
            this.listeningEvents.push(() => {
                (source.$off || source.off).call(source, event, fn);
            });
            (source.$on || source.on).call(source, event, fn);
        },
        listenOnce: function listenOnce(source, event, fn) {
            this.listeningEvents = this.listeningEvents || [];
            this.listeningEvents.push(() => {
                (source.$off || source.off).call(source, event, fn);
            });
            (source.$once || source.once).call(source, event, fn);
        },
    },
});

export function startApp() {
    Application.on(Application.uncaughtErrorEvent, (args) => {
        console.log('main Application.uncaughtErrorEvent', args.eventName, args.error);
        log.error(args.eventName, args.error);
    });

    Vue.config.errorHandler = (err, vm, info) => {
        console.log('main Vue.config.errorHandler', err.message + '\n' + err.stack);
        log.error(err.message + '\n' + err.stack);
    };

    initLocalization();
    loadGlobalComponents();

    /* global TNS_ENV */
    if (TNS_ENV !== 'production') {
        // Vue.config.silent = false;
        // Vue.use(VueDevtools, { host: '192.168.1.211' });
    }

    console.log("$start app");

    /* eslint-disable no-new */
    new Vue({
        render: (h) => h('frame', [h(LoaderPage)]),
        i18n: new VueI18Next(i18next),
    }).$start();
}

function initLocalization() {
    // eslint-disable-next-line global-require
    const AvailableLocales = require('@/res/locales/available.json');
    Vue.use(VueI18Next);

    i18next.init({
        whitelist: AvailableLocales.locales,
        fallbackLng: 'en-us',
        lowerCaseLng: true,
        interpolation: {
            // We let vuejs handle HTML output escaping
            escapeValue: false,
        },
    });
}

function loadGlobalComponents() {
    Vue.component('AwayStatusIndicator', AwayStatusIndicator);
    Vue.component('Avatar', Avatar);
    Vue.component('FormattedMessage', FormattedMessage);
    Vue.component('MessageListMessage', MessageListMessage);
    Vue.component('MessageListUrlPreview', MessageListUrlPreview);
    Vue.component('BufferActionBar', BufferActionBar);
    Vue.component('BasicActionBar', BasicActionBar);
    Vue.component('IconTextField', IconTextField);
    Vue.component('KiwiDropdown', KiwiDropdown);

    Vue.use(RadSideDrawer);

    Vue.registerElement(
        'CheckBox',
        // eslint-disable-next-line global-require
        () => require('@nstudio/nativescript-checkbox').CheckBox,
        {
            model: {
                prop: 'checked',
                event: 'checkedChange',
            },
        }
    );

    Vue.directive('dismissesIOSKeyboard', {
        bind(el, binding) {
            if (!isIOS) {
                return;
            }

            if (typeof binding.value === 'undefined' || binding.value === true) {
                el.nativeView.on('loaded', (event) => {
                    PageKeyboardManager.addScrollDismiss(event.object);
                });
            }
        },
    });

    Vue.directive('focusOnIOSKeyboard', {
        bind(el, binding) {
            if (!isIOS) {
                return;
            }

            if (typeof binding.value === 'undefined' || binding.value === true) {
                el.nativeView.on('focus', (event) => {
                    PageKeyboardManager.scrollToMe(event.object);
                });
            }
        },
    });

    Vue.directive('touchPop', {
        bind(el, binding) {
            if (typeof binding.value === 'undefined' || binding.value === true) {
                el.nativeView.on('loaded', (event) => addTouchPop(event.object));
            }
        },
    });

    Vue.directive('centerLabel', {
        bind(el, binding) {
            if (typeof binding.value === 'undefined' || binding.value === true) {
                el.nativeView.on('loaded', (event) => {
                    if (isAndroid) {
                        event.object.android.setGravity(17);
                    }
                });
            }
        },
    });

    Vue.directive('cellHighlight', {
        bind(el, binding) {
            if (
                typeof binding.value === 'undefined' ||
                binding.value === 'enabled'
            ) {
                el.nativeView.on('loaded', (event) => addCellHighlight(event.object));
            }
        },
    });
}
