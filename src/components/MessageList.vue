<template>
    <list-view
        ref="messageList"
        v-dismissesIOSKeyboard
        for="message in messages"
        separatorColor="transparent"
        backgroundColor="transparent"
        scaleY="-1"
        iosOverflowSafeArea="false"
        @loaded="loaded"
        @layoutChanged="layoutChanged"
        @loadMoreItems="loadMoreItems"
    >
        <v-template
            if="message.isMessage && !message.isRepeat"
            name="message"
        >
            <message-list-author-message
                :message="message"
                :network="network"
                :isFirst="$index === 0"
                @nickDoubleTap="nickDoubleTap"
                @openMessageOptions="openMessageOptions"
                @openUrl="$state.$emit('mediaviewer.show', $event)"
            />
        </v-template>
        <v-template
            if="message.isMessage && message.isRepeat"
            name="message-repeat"
        >
            <message-list-message
                v-cellHighlight
                class="messagelist-item"
                :message="message"
                :isFirst="$index === 0"
                scaleY="-1"
                @openMessageOptions="openMessageOptions"
                @openUrl="$state.$emit('mediaviewer.show', $event)"
            />
        </v-template>
        <v-template
            if="!message.isMessage && message.type === 'date-change'"
            name="date-change"
        >
            <grid-layout
                :class="[
                    'messagelist-item',
                    'messagelist-item-date-change',
                    {
                        'messagelist-item--highlight': message.isHighlight,
                        'messagelist-item--unread': message.isUnread,
                        'messagelist-item--first': $index === 0,
                    }
                ]"
                columns="*, auto, *"
            >
                <label
                    col="1"
                    class="date-text"
                    :text="message.dateString"
                    scaleY="-1"
                />
                <label
                    col="0"
                    class="divider"
                />
                <label
                    col="2"
                    class="divider"
                />
            </grid-layout>
        </v-template>

        <v-template
            if="!message.isMessage"
            name="notification"
        >
            <formatted-message
                v-cellHighlight
                :class="[
                    'messagelist-item',
                    'messagelist-item-notification',
                    {
                        'messagelist-item--highlight': message.isHighlight,
                        'messagelist-item--unread': message.isUnread,
                        'messagelist-item--first': $index === 0,
                    },
                    'messagelist-item-' + message.type,
                    message.type_extra
                        ? `messagelist-item-${message.type}-${message.type_extra}`
                        : '',
                ]"
                :messageBlocks="message.messageBlocks"
                scaleY="-1"
                @tap="openMessageOptions($event, message)"
            />
        </v-template>
    </list-view>
</template>

<script>
'kiwi public';

import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { isIOS, isAndroid, GestureTypes } from '@nativescript/core';
import { Menu } from 'nativescript-menu';
import { Toasty } from 'nativescript-toasty';

import * as bufferTools from '@/libs/bufferTools';
import parseMessage from '@/libs/MessageParser';
import { createNickColour } from '@/helpers/TextFormatting';
import GlobalApi from '@mobile/libs/GlobalApi';
import { strftime } from '@mobile/libs/utils/lang';
import { getUrlPreviewAttach } from '@mobile/libs/utils/UrlEmbed';
import MessageListAuthorMessage from './MessageListAuthorMessage';

const Diff = require('diff');

const clipboard = require('nativescript-clipboard');

export default {
    components: { MessageListAuthorMessage },
    props: ['buffer'],
    data() {
        return {
            messages: new ObservableArray([]),
            seeBottom: true,
            scrollPollID: null,
            messageToScrollId: null,
            showingMessageOptions: false,
        };
    },
    computed: {
        network() {
            return this.buffer && this.buffer.getNetwork();
        },
        myNick() {
            return this.network ? this.network.nick : '';
        },
        bufferIsReady() {
            return this.buffer.isReady();
        },
    },
    watch: {
        'buffer.name': function(newBufferName) {
            this.resetMessageList();
        },
        'buffer.last_read': function(lastRead, oldLastRead) {
            this.updateMessages();
        },
        'buffer.message_count': function(newCount, oldCount) {
            this.updateMessages();
        },
        seeBottom(seeBottom) {
            this.buffer.isMessageTrimming = seeBottom;
        },
    },
    mounted() {
        this.$nextTick(() => {
            this.resetMessageList();
        });
    },
    methods: {
        resetMessageList() {
            setTimeout(() => {
                this.scrollToBottom();
            }, 100);
            this.seeBottom = true;
            this.messages.length = 0;
            // this.$refs.messageList.refresh();
            this.updateMessages();
        },
        updateMessages() {
            const buffer = this.buffer;
            const messages = bufferTools.orderedMessages(buffer);
            for (let i = messages.length - 1; i >= 0; i--) {
                const message = messages[i];
                const previousMessage = messages[i - 1];

                // hydrate the message with some info
                this.hydrateMessage(message);

                // workaround because the object looses the user ref in the observable array.
                if (message.user) {
                    message.userRef = message.user;
                }

                if (
                    previousMessage &&
                    previousMessage.nick === message.nick &&
                    message.time - previousMessage.time < 60000 &&
                    previousMessage.type !== 'traffic' &&
                    message.type !== 'traffic'
                ) {
                    message.isRepeat = true;
                }

                // insert date divider
                if (
                    (!previousMessage &&
                        new Date().getDay() !==
                        new Date(message.time).getDay()) ||
                    (previousMessage &&
                        new Date(previousMessage.time).getDay() !==
                        new Date(message.time).getDay())
                ) {
                    messages.splice(i, 0, {
                        id: 'date-change-' + message.time,
                        type: 'date-change',
                        time: message.time,
                        dateString: strftime(
                            this.$t('date_divider_format'),
                            new Date(message.time)
                        ),
                    });
                }
            }

            // because the list view is inverted
            messages.reverse();

            // In this next block, we update the message list observable array in 3 steps:
            // 1- convert the observable array into an array of {id, time} objects.
            // 2- Use a Diff algorythm to compare our new message array with the previous list
            // 3- use the result of the diff to update the observable array

            // step 1
            const currentIds = this.messages.reduce((acc, item) => {
                if (item) {
                    acc.push({ id: item.id, time: item.time });
                }
                return acc;
            }, []);

            // step 2
            const changes = Diff.diffArrays(currentIds, messages, {
                comparator: (left, right) => left.id === right.id && left.time === right.time,
            });

            // step 3
            let index = 0;
            changes.forEach((change) => {
                if (change.removed) {
                    // remove items
                    this.messages.splice(index, change.count);
                } else if (change.added) {
                    // add items
                    if (index === 0) {
                        const newItems = change.value;
                        if (this.seeBottom) {
                            this.messages.unshift(...newItems);
                            this.$emit('newMessagesCountChanged', 0);
                        } else {
                            this.$emit(
                                'newMessagesCountChanged',
                                newItems.length
                            );
                        }
                    } else {
                        this.messages.splice(index, 0, ...change.value);
                    }
                    index += change.count;
                } else {
                    index += change.count;
                }
            });
        },
        nickDoubleTap(nick) {
            this.$state.$emit('controlinput.insertNick', nick);
        },
        loaded(event) {
            if (isIOS) {
                /* global UITableViewAutomaticDimension */
                this.$refs.messageList.nativeView.rowHeight = UITableViewAutomaticDimension;
            }

            event.object.on(GestureTypes.pan, (args) => {
                if (this.scrollPollID === null) {
                    this.scrollPollID = setInterval(() => {
                        if (
                            this.messages.length === 0 ||
                            this.isLatestMessageVisible()
                        ) {
                            this.seeBottom = true;
                            clearInterval(this.scrollPollID);
                            this.scrollPollID = null;
                            this.updateMessages();
                        } else {
                            this.seeBottom = false;
                        }
                    }, 300);
                }
            });

            fixScrollMomentum(event.object);
        },
        loadMoreItems() {
            if (this.shouldShowChathistoryTools() && !this.buffer.flag('is_requesting_chathistory')) {
                this.$emit('pullToRequest');
            }
        },
        layoutChanged() {
            setTimeout(() => this.scrollToBottom(false), 100);
        },
        openMessageOptions(event, message) {
            const sender = message.userRef;
            if (!message || this.showingMessageOptions) {
                return;
            }

            const urls = message.messageBlocks
                .filter((block) => block.type === 'url')
                .map((block) => block.meta.url);
            const users = message.messageBlocks
                .filter((block) => block.type === 'user')
                .map((block) => block.meta.user);
            const channels = message.messageBlocks
                .filter((block) => block.type === 'channel')
                .map((block) => block.meta.channel);

            if (
                !sender &&
                urls.length === 0 &&
                users.length === 0 &&
                channels.length === 0 &&
                !message.message
            ) {
                return;
            }

            const urlsList = urls.map((url) => {
                const urlAction =
                    url.length > 40
                        ? '🔗 ' +
                        url.substr(0, 25) +
                        '…' +
                        url.substr(url.length - 14)
                        : '🔗 ' + url;

                return {
                    title: urlAction,
                    type: 'url',
                    value: url,
                };
            });

            const usersList = users.map((user) => ({
                title: '👤 ' + user,
                type: 'user',
                value: this.$state.getUser(this.buffer.networkid, user),
            }));

            if (sender && users.every((user) => user !== sender.nick)) {
                usersList.unshift({
                    title: '👤 ' + sender.nick,
                    type: 'user',
                    value: sender,
                });
            }

            const channelsList = channels.map((channel) => ({
                title: '＃ ' + channel,
                type: 'channel',
                value: channel,
            }));

            const actionsList = [
                ...usersList,
                ...channelsList,
                ...urlsList,
            ];
            actionsList.push({
                title: '📋 ' + this.$t('copy_clipboard'),
                type: 'clipboard',
                value: message.message,
            });

            this.showingMessageOptions = true;
            Menu.popup({
                view: event.view,
                actions: actionsList,
                cancelButtonText: this.$t('cancel'),
            })
                .then((action) => {
                    if (!action) {
                        return;
                    }

                    switch (action.type) {
                    case 'url':
                        this.$state.$emit('mediaviewer.show', action.value);
                        break;
                    case 'user':
                        this.$state.$emit('userbox.show',
                            action.value,
                            {
                                network: this.network,
                                buffer: this.buffer,
                            });
                        break;
                    case 'channel':
                        this.$state.addBuffer(
                            this.buffer.networkid,
                            action.value
                        );
                        this.network.ircClient.join(action.value);
                        break;
                    case 'clipboard':
                        clipboard.setText(action.value).then(() => {
                            new Toasty({
                                text: this.$t('copied_clipboard'),
                            }).show();
                        });
                        break;
                    default: break;
                    }
                })
                .catch(console.error)
                .finally(() => {
                    this.showingMessageOptions = false;
                });
        },

        isLatestMessageVisible() {
            if (!this.$refs.messageList) {
                return false;
            }

            const messageListView = this.$refs.messageList.nativeView;
            return messageListView.isItemAtIndexVisible(0);
        },
        formatTime(time) {
            return strftime(
                this.buffer.setting('timestamp_format') || '%T',
                new Date(time)
            );
        },
        isRepeat(index) {
            const message = this.messages[index];
            const prevMessage = this.messages[index - 1];

            return (
                prevMessage &&
                prevMessage.nick === message.nick &&
                message.time - prevMessage.time < 60000 &&
                prevMessage.type !== 'traffic' &&
                message.type !== 'traffic'
            );
        },
        hydrateMessage(message) {
            message.isMessage = ['privmsg', 'action', 'notice', 'message'].includes(message.type);
            message.isOwn = message.nick === this.myNick.toLowerCase();
            message.formatedTime = this.formatTime(message.time);
            message.nickColour = createNickColour(message.nick);
            message.isUnread =
                this.buffer.last_read &&
                message.time > this.buffer.last_read;

            message.messageBlocks = parseMessage(
                message.message,
                {
                    extras: true,
                },
                this.buffer.users || []
            );

            if (!message.hasRendered) {
                GlobalApi.singleton().emit('message.render', { message: message });

                message.mentioned_urls = message.messageBlocks
                    .filter((block) => block.type === 'url')
                    .map((block) => block.meta.url);

                message.maybeAutoEmbed();

                message.attach = message.attach || [];
                const urlPreviewAttach = getUrlPreviewAttach(message);
                if (urlPreviewAttach) {
                    message.attach.push(urlPreviewAttach);
                }

                message.hasRendered = true;
            }
        },
        scrollToBottom(animated = false) {
            if (!this.$refs?.messageList?.nativeView) {
                return;
            }

            // don't try to scroll in empty messagelist. Fixes occasionalcrash on iOS.
            if (isIOS &&
                this.$refs.messageList.nativeView.ios &&
                this.$refs.messageList.nativeView.ios.numberOfRowsInSection(0) === 0) {
                return;
            }

            if (animated) {
                this.$refs.messageList.nativeView.scrollToIndexAnimated(0);
            } else {
                this.$refs.messageList.nativeView.scrollToIndex(0);
            }
        },
        shouldShowChathistoryTools() {
            // Only show it if we're connected
            if (this.network.state !== 'connected') {
                return false;
            }

            let isCorrectBufferType =
                this.buffer.isChannel() || this.buffer.isQuery();
            let isSupported = !!this.network.ircClient.chathistory.isSupported();

            return (
                isCorrectBufferType &&
                isSupported &&
                this.buffer.flags.chathistory_available
            );
        },
        // onItemLoading(args) {
        //     if (isIOS) {
        //         const iosCell = args.ios;
        //         /* global UITableViewCellSelectionStyle, UIColor */
        //         iosCell.selectionStyle = UITableViewCellSelectionStyle.None;

        //         // Workaround for a bug introduced in iOS 14 where the cells background turned
        //         // white. Goes throught the subviews of the cellview and makes the background
        //         // transparentinstead of white.
        //         for (let i = 0; i < iosCell.subviews.count; i++) {
        //             for (let j = 0; j < iosCell.subviews[i].subviews.count; j++) {
        //                 if (iosCell.subviews[i].subviews[j].backgroundColor) {
        //                     iosCell.subviews[i].subviews[j].backgroundColor = UIColor.clearColor;
        //                 }
        //             }
        //         }
        //     }
        // },
    },
};

/**
 * Applies a fix for Android API 28 where the momentum is applied in the oposite direction
 * of the movement when scaleY=-1 (which is the trick to invert the scroll direction).
 * Bug: https://android-review.googlesource.com/c/platform/frameworks/native/+/800996.
 * This function will suppress the default momentum behaviour and manually apply the
 * momentum.
 */
function fixScrollMomentum(listview) {
    /* global android */
    if (!isAndroid || android.os.Build.VERSION.SDK_INT !== 28) {
        return;
    }

    // suppress the default momentum behaviour
    listview.android.setVelocityScale(0);

    // stores the last 3 move events in this array
    let lastMoveEvents = [];

    listview.on(GestureTypes.touch, (args, b) => {
        if (args.action === 'up') {
            const eventCount = lastMoveEvents.length;
            if (eventCount < 2) {
                return;
            }

            // calculate velocity based on the fist and last recorded move events.
            const flingVelocity =
                ((lastMoveEvents[eventCount - 1].y - lastMoveEvents[0].y) /
                    (lastMoveEvents[eventCount - 1].time -
                        lastMoveEvents[0].time)) *
                1500 *
                -1;

            // apply the velocity
            listview.android.fling(flingVelocity);
        } else if (args.action === 'move') {
            // add the move event to the array and crop its length to 3.
            lastMoveEvents.unshift({
                x: args.getX(),
                y: args.getY(),
                time: Date.now(),
            });
            lastMoveEvents = lastMoveEvents.slice(0, 3);
        } else if (args.action === 'down' || args.action === 'cancel') {
            lastMoveEvents = [];
        }
    });
}
</script>

<style lang="scss">
.messagelist-item {
    color: var(--default-fg);
    line-height: 1;

    &.messagelist-item--unread {
        border-left-width: 4;
        border-left-color: var(--info3);
    }

    &.messagelist-item--first {
        margin-top: 10;
    }
}

.messagelist-message {
    padding-left: 60;
    padding-right: 10;
    padding-bottom: 5;
    &.messagelist-item--unread {
        padding-left: 56;
    }
}

.messagelist-item-notification {
    padding: 10;
    text-align: center;
}

.messagelist-item.messagelist-item-topic {
    color: var(--default-fg);
    background: var(--neutral1);
    border-width: 2;
    border-color: var(--accent3);
    border-radius: 2;
    margin: 10 10;
    padding: 10;
    text-align: left;
}

/* action */
.messagelist-item-action.formattedmessage-body {
    color: var(--info3);
    font-style: italic;
}

.messagelist-item--highlight {
    background-color: rgba(66, 122, 84, 0.2);
}

/* Errors */
.messagelist-item-error {
    background: var(--error1);
    border-left-color: var(--error3);
}

.messagelist-item-connection-connected {
    background-color: var(--success3);
    color: var(--success1);
}
.messagelist-item-connection-disconnected {
    background-color: var(--error4);
    color: var(--error1);
}
.messagelist-item-connection-connecting {
    background-color: var(--warning3);
    color: var(--warning1);
}

.messagelist-item-presence {
    color: var(--neutral3);
    font-style: italic;
    padding: 5 0;
}

.messagelist-item-date-change {
    margin: 10 0;
    text-align: center;

    .date-text {
        color: var(--neutral3);
        font-style: italic;
        font-size: 13;
        padding: 5 10;
    }

    .divider {
        vertical-align: center;
    }
}

/* Messagelist traffic messages */
.messagelist-item-traffic {
    text-align: left;
    background-color: rgba(162, 165, 167, 0.6);
    padding-top: 10;
    padding-bottom: 10;
    padding-right: 20;
    padding-left: 60;
    &.messagelist-item--unread {
        padding-left: 56;
    }

    &.messagelist-item-traffic-join {
        color: var(--text-success);
    }

    &.messagelist-item-traffic-quit,
    &.messagelist-item-traffic-part,
    &.messagelist-item-traffic-kick {
        color: var(--text-error);
    }
}
</style>
