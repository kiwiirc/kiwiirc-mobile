'kiwi public';

import _ from 'lodash';

let createdInstance = null;

export default class ThemeManager {
    constructor(state) {
        this.state = state;
        this.listenForIrcEvents();
    }

    themeVar(varName) {
        switch (varName) {
            case 'nick-brightness':
                return 40;
            case 'supports-monospace':
                return 1;
            default:
                return false;
        }
    }

    availableThemes() {
        return this.state.settings.themes;
    }

    currentTheme() {
        let state = this.state;
        let currentThemeName = state.setting('theme');
        currentThemeName = currentThemeName.toLowerCase();

        let theme = _.find(state.settings.themes, t => {
            let isMatch = t.name.toLowerCase() === currentThemeName;
            return isMatch;
        });

        // If no theme was set, use the first one in our theme list
        if (!theme) {
            theme = state.settings.themes[0];
        }

        return theme;
    }

    setTheme(theme) {
        let theTheme = null;

        if (typeof theme === 'string') {
            // Make sure this theme exists
            theTheme = _.find(this.availableThemes(), t => {
                let isMatch = t.name.toLowerCase() === theme.toLowerCase();
                return isMatch;
            });

            if (!theTheme) {
                return;
            }
        } else {
            theTheme = theme;
        }

        this.state.setting('theme', theTheme.name);
        this.state.$emit('theme.change');
    }

    reload() {
        this.state.$emit('theme.change');
    }

    // When we get a CTCP 'kiwi theme reload' then reload our theme. Handy for theme devs
    listenForIrcEvents() {
        this.state.$on('irc.ctcp request', (event, network) => {
            let ctcpType = (event.type || '').toLowerCase();
            if (
                ctcpType === 'kiwi' &&
                event.message.indexOf('theme reload') > -1
            ) {
                this.reload();
            }
        });
    }
}

ThemeManager.instance = function instance(state) {
    if (!createdInstance) {
        createdInstance = new ThemeManager(state);
    }

    return createdInstance;
};
