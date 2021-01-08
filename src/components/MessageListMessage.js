'kiwi public';

import FormattedMessage from '@mobile/components/FormattedMessage';
import MessageListUrlPreview from '@mobile/components/MessageListUrlPreview';

export default {
    functional: true,
    props: {
        message: Object,
        isFirst: Boolean,
    },
    render(createElement, context) {
        const message = context.props.message;
        const elementOptions = {
            staticClass: context.data.staticClass,
            class: {
                'messagelist-message': true,
                'messagelist-item--own': message.isOwn,
                'messagelist-item--unread': message.isUnread,
                'messagelist-item--highlight': message.isHighlight,
                'messagelist-item--first': context.props.isFirst,
                ...context.data.class,
            },
            attrs: context.data.attrs,
            on: context.data.on,
            directives: context.data.directives,
        };

        const parts = [];

        // if there are no attachments to render, render just the message
        if (message.attach?.length) {
            message.attach.forEach((attach) => {
                switch (attach.embedType) {
                // if (message.message === attach.url) {
                //     message.supressMessage = true;
                // }
                // parts.push({
                //     component: MessageListImagePreview,
                //     props: { ...attach },
                // });
                // break;
                case 'image':
                case 'url':
                    if (message.message === attach.url) {
                        message.supressMessage = true;
                    }
                    parts.push({
                        component: MessageListUrlPreview,
                        props: attach,
                        on: {
                            tap: (event) => {
                                if (typeof context.listeners.openUrl === 'function') {
                                    context.listeners.openUrl(attach.url);
                                }
                            },
                        },
                    });
                    break;
                default:
                    break;
                }
            });
        }

        if (!message.supressMessage) {
            parts.unshift({
                component: FormattedMessage,
                props: {
                    messageBlocks: message.messageBlocks,
                },
                on: {
                    tap: (event) => {
                        if (typeof context.listeners.openMessageOptions === 'function') {
                            context.listeners.openMessageOptions(event, message);
                        }
                    },
                },
            });
        }

        // if there are no attachments to render, render just the message
        if (parts.length === 1) {
            return createElement(parts[0].component, {
                ...elementOptions,
                on: parts[0].on,
                props: parts[0].props,
            });
        }

        return createElement(
            'stack-layout',
            parts.map((part) => createElement(part.component, {
                ...elementOptions,
                props: part.props,
                on: part.on,
            }))
        );
    },
};
