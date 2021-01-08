'kiwi public';

/**
 * Plays vibrations
 */

import { Vibrate } from 'nativescript-vibrate';

export class VibrationManager {
    constructor() {
        this.lastPlayed = 0;
        this.vibrator = new Vibrate();
    }

    /** Play the alert sound */
    vibrate() {
        // Only vibrate once every 2 seconds
        if (!this.lastPlayed || Date.now() - this.lastPlayed > 2000) {
            this.vibrator.vibrate();
            this.lastPlayed = Date.now();
        }
    }

    listen(state) {
        state.$on('audio.bleep', () => {
            this.vibrate([100, 100, 100]);
        });
    }

    /** Watch the Kiwi state for any message highlights and play an alert */
    watchForMessages(state) {
        state.$on('message.new', (event) => {
            let { message, buffer } = event;

            if (buffer.setting('mute_sound')) {
                return;
            }

            let ignoreTypes = ['connection', 'traffic', 'mode', 'nick'];
            if (ignoreTypes.indexOf(message.type) > -1) {
                return;
            }

            if (message.ignore || buffer.isSpecial()) {
                return;
            }

            let isHighlight = message.isHighlight;
            let isActiveBuffer = state.getActiveBuffer() === buffer;
            let inFocus = isActiveBuffer && state.ui.app_has_focus;

            if (isHighlight || (buffer.isQuery() && !inFocus)) {
                this.vibrate();
            }
        });
    }
}
