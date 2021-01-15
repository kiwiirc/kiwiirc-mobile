<template>
    <grid-layout class="controlinput p-x-10 p-t-10"
                 rows="auto, 60"
                 columns="auto, *, auto"
    >
        <stack-layout class="controlinput-tools"
                      row="0"
                      colSpan="3"
        >
            <component :is="plugin.component"
                       v-for="plugin in pluginUiTop"
                       :key="plugin.id"
                       v-bind="plugin.props"
            />
        </stack-layout>
        <avatar
            :user="network && network.currentUser()"
            col="0"
            row="1"
            class="controlinput-avatar m-t-5"
            @tap="openSelfUser"
        />
        <away-status-indicator
            :network="network"
            :user="network && network.currentUser()"
            col="0"
            row="1"
            class="controlinput-awaystatusindicator"
            toggle="false"
        />
        <text-field
            id="control-text-field"
            ref="textInput"
            v-model="input"
            :hint="$t('input_placeholder')"
            col="1"
            row="1"
            class="controlinput-input m-l-5  m-t-5"
            returnKeyType="send"
            @textChange="checkAutoComplete"
            @returnPress="send"
            @loaded="initTextField"
        />
        <stack-layout orientation="horizontal"
                      class="controlinput-tools m-t-5"
                      row="1"
                      col="2"
        >
            <component :is="plugin.component"
                       v-for="plugin in pluginUiTools"
                       :key="plugin.id"
                       v-bind="plugin.props"
            />
        </stack-layout>
    </grid-layout>
</template>

<script>
'kiwi public';

import _ from 'lodash';
import { isIOS, isAndroid } from '@nativescript/core';

import Logger from '@/libs/Logger';
import GlobalApi from '@mobile/libs/GlobalApi';

const log = Logger.namespace('ControlInput');

export default {
    props: {
        buffer: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            input: '',
            history: [],
            pluginUiTools: GlobalApi.singleton().controlInputToolPlugins,
            pluginUiTop: GlobalApi.singleton().controlInputTopPlugins,
        };
    },
    computed: {
        currentNick() {
            return this.network ? this.network.nick : '';
        },
        network() {
            return this.buffer.getNetwork();
        },
        allAutoCompleteItems() {
            let list = [];

            if (!this.buffer) {
                return list;
            }

            const users = this.buffer.users;
            let userList = _.values(users).map((user) => {
                let item = {
                    text: user.nick,
                    type: 'user',
                };
                return item;
            });

            if (this.buffer.isQuery()) {
                userList.push({
                    text: this.buffer.name,
                    type: 'user',
                });
            }

            list = list.concat(userList);

            let bufferList = [];
            this.buffer.getNetwork().buffers.forEach((buffer) => {
                if (buffer.isChannel()) {
                    bufferList.push({
                        text: buffer.name,
                        type: 'buffer',
                    });
                }
            });

            list = list.concat(bufferList);

            return list;
        },
        userStatus() {
            if (!this.network || this.network.state === 'disconnected') {
                return 'disconnected';
            } else if (
                this.network.state === 'connecting' ||
                this.network.currentUser().away
            ) {
                return 'away';
            }

            return 'connected';
        },
    },
    created() {
        this.listen(this.$state, 'controlinput.insertNick', (nick) => {
            this.insertNick(nick);
        });
    },
    methods: {
        initTextField(event) {
            const textFieldView = event.object;
            const controlInputNativeView = this.$el.nativeView;

            if (isIOS) {
                if (!textFieldView.ios.inputAccessoryView) {
                    // create the InputAccessoryView and listen to keyboard position changes.
                    // eslint-disable-next-line global-require
                    const InputAccessoryView = require('./commons/InputAccessoryView')
                        .InputAccessoryView;
                    textFieldView.ios.inputAccessoryView = InputAccessoryView.alloc().init({
                        keyboardPositionChanged: (position) => {
                            if (!controlInputNativeView.ios.window) {
                                return;
                            }
                            const translateY = Math.min(
                                0,
                                -position +
                                        controlInputNativeView.ios.window
                                            .safeAreaInsets.bottom
                            );
                                // change the position of this ControlInput
                            controlInputNativeView.translateY = translateY;

                            // emit event to BufferChat so it can adjust the position of
                            // the AutoComplete and new messages button
                            this.$emit(
                                'keyboardPositionChanged',
                                translateY
                            );
                        },
                    });
                }

                // keep the keyboard after the user presses enter or send.
                const UndismissableUITextFieldDelegate =
                    // eslint-disable-next-line global-require
                    require('./commons/UndismissableUITextFieldDelegate')
                        .UndismissableUITextFieldDelegate;

                /* eslint-disable no-underscore-dangle */
                textFieldView._delegate = UndismissableUITextFieldDelegate
                    .initWithOriginalDelegate(textFieldView._delegate);
            }
            if (isAndroid) {
                /* global WeakRef, android */
                // keep the keyboard after the user presses enter or send.
                let that = new WeakRef(textFieldView);
                const editorActionListener = new android.widget.TextView.OnEditorActionListener({
                    onEditorAction: function(textView, actionId, editorEvent) {
                        let owner = that.get();
                        if (owner) {
                            if (
                                actionId ===
                                        android.view.inputmethod.EditorInfo
                                            .IME_ACTION_SEND ||
                                    (editorEvent &&
                                        editorEvent.getKeyCode() ===
                                            android.view.KeyEvent.KEYCODE_ENTER)
                            ) {
                                // eslint-disable-next-line no-underscore-dangle
                                owner._onReturnPress();
                                return true;
                            }
                        }
                        return false;
                    },
                });
                textFieldView.android.setOnEditorActionListener(editorActionListener);
            }
        },
        openSelfUser() {
            this.$state.$emit('user-settings.show');
        },
        send(event) {
            if (this.input === '') {
                return;
            }

            log('sending ', this.input);
            this.$state.$emit('input.raw', this.input);

            // Add to history, keeping the history trimmed to the last 50 entries
            this.history.push(this.input);
            this.history.splice(0, this.history.length - 50);
            this.history_pos = this.history.length;

            this.input = '';
        },
        applyAutoComplete(item) {
            const currentCursorPosition = this.getCursorPosition();
            const currentWord = this.getCurrentWord();
            const currentInput = this.input;

            let insertString = item.text;
            if (item.type === 'user') {
                insertString = item.text + ' ';
                if (currentCursorPosition - currentWord.position === 0) {
                    insertString = item.text + ': ';
                }
            }

            this.input =
                currentInput.substr(
                    0,
                    currentCursorPosition - currentWord.position
                ) +
                insertString +
                currentInput.substr(currentCursorPosition);

            this.$nextTick(() => {
                this.setCursorPosition(currentCursorPosition +
                        insertString.length -
                        currentWord.position);
            });
        },
        insertNick(nick) {
            const currentCursorPosition = this.getCursorPosition();
            const currentInput = this.input;

            let insertString = nick + ' ';
            if (currentCursorPosition === 0) {
                insertString = nick + ': ';
            }

            this.input =
                currentInput.substr(0, currentCursorPosition) +
                insertString +
                currentInput.substr(currentCursorPosition);

            this.$nextTick(() => {
                this.$refs.textInput.nativeView.focus();
                this.setCursorPosition(currentCursorPosition + insertString.length);
            });
        },
        getCursorPosition() {
            const nativeView = this.$refs.textInput.nativeView;
            if (isIOS) {
                const beginOfDoc = nativeView.ios.beginningOfDocument;
                const selectedRange = nativeView.ios.selectedTextRange;
                const cursorPos = nativeView.ios.offsetFromPositionToPosition(
                    beginOfDoc,
                    selectedRange.start
                );
                return cursorPos;
            }

            return nativeView.android.getSelectionEnd();
        },
        setCursorPosition(position) {
            const nativeView = this.$refs.textInput.nativeView;
            if (isIOS) {
                try {
                    const beginOfDoc = nativeView.ios.beginningOfDocument;
                    const textPosition = nativeView.ios.positionFromPositionOffset(
                        beginOfDoc,
                        position
                    );
                    nativeView.ios.selectedTextRange =
                        nativeView.ios.textRangeFromPositionToPosition(
                            textPosition,
                            textPosition
                        );
                } catch (e) {
                    console.log(e);
                }
            }
            try {
                nativeView.android.setSelection(position);
            } catch (e) {
                // do nothing
            }
        },
        checkAutoComplete(event) {
            setTimeout(() => {
                const currentWord = this.getCurrentWord();
                if (currentWord.word.length < 2) {
                    this.$emit('updateAutoCompleteItems', []);
                    return;
                }

                const currentAutoCompleteItems = this.allAutoCompleteItems.filter((item) => (
                    item.text
                        .toLowerCase()
                        .startsWith(currentWord.word.toLowerCase()) &&
                            item.text.toLowerCase() !==
                                currentWord.word.toLowerCase()
                ));

                this.$emit('updateAutoCompleteItems', currentAutoCompleteItems);
            }, 10);
        },
        getCurrentWord() {
            return this.getWordAtPosition(this.input, this.getCursorPosition());
        },
        getWordAtPosition(text, position) {
            let startVal = text.substring(0, position);
            let space = startVal.lastIndexOf(' ');
            if (space === -1) {
                space = 0;
            } else {
                // include the space after the word
                space++;
            }
            let startPos = space;

            space = text.indexOf(' ', startPos);
            if (space === -1) space = text.length;
            let endPos = space;

            return {
                word: text.substring(startPos, endPos),
                position: position - startPos,
            };
        },
        blur() {
            log('huhu when I hear heavy metal!');
            this.$refs.textInput.nativeView.dismissSoftInput();
            if (isIOS) {
                this.$refs.textInput.nativeView.ios.resignFirstResponder();
            }
        },
    },
};
</script>

<style lang="scss">
/* Control Input - displayed at bottom of Kiwi ( ControlInput.vue ) */
.controlinput {
    background: var(--neutral2);
}

.controlinput-avatar {
    horizontal-align: center;
    vertical-align: top;
}

.awaystatusindicator.controlinput-awaystatusindicator {
    horizontal-alignment: center;
    vertical-align: top;
    margin-top: 39;
}

.controlinput-input {
    vertical-align: top;
    height: 40;
    padding: 0 10;
    font-size: 15;
    line-height: 15;
    background: var(--neutral1);
    color: var(--neutral5);
    border-width: 2;
    border-color: rgba(0, 0, 0, 0.2);
    border-radius: 20;
    placeholder-color: var(--hint-color);
}
</style>
