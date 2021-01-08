<script>
'kiwi public';

import { FormattedString } from 'tns-core-modules/text/formatted-string';
import { Span } from 'tns-core-modules/text/span';

export default {
    functional: true,
    props: ['messageBlocks'],
    render(createElement, context) {
        let classes = [];
        if (context.data.class) {
            if (Array.isArray(context.data.class)) {
                classes = [...context.data.class, 'formattedmessage-body'];
            } else {
                classes = { ...context.data.class, 'formattedmessage-body': true };
            }
        }
        return createElement('label', {
            staticClass: context.data.staticClass,
            class: classes,
            attrs: {
                ...context.data.attrs,
                formattedText: formatMessage(context.props.messageBlocks),
                textWrap: true,
                borderRadius: 2,
            },
            on: context.data.on,
            directives: context.data.directives,
        });
    },
};

function formatMessage(messageBlocks) {
    const formattedMessage = new FormattedString();

    if (!messageBlocks) {
        return formattedMessage;
    }

    const spans = messageBlocks
        .filter((block) => block.containsContent)
        .map((block, i) => {
            const span = new Span();
            span.text = block.content;
            span.backgroundColor = 'transparent';

            let spanStyle = '';
            Object.keys(block.styles).forEach((s) => {
                if (s === 'underline') {
                    spanStyle += 'text-decoration: underline;';
                } else if (s === 'bold') {
                    spanStyle += 'font-weight: bold;';
                } else if (s === 'italic') {
                    spanStyle += 'font-style: italic;';
                } else if (s === 'quote') {
                    span.cssClasses.add('formatting-extras-quote');
                    span.backgroundColor = '';
                } else if (s === 'block') {
                    span.cssClasses.add('formatting-extras-block');
                    span.backgroundColor = '';
                } else if (s === 'color') {
                    span.cssClasses.add(`irc-fg-colour-${block.styles[s]}`);
                } else if (s === 'background') {
                    span.cssClasses.add(`irc-bg-colour-${block.styles[s]}`);
                    span.backgroundColor = '';
                }
            });

            span.style = spanStyle;

            if (block.type === 'channel') {
                span.cssClasses.add('channel');
            }

            if (block.type === 'url') {
                span.cssClasses.add('url');
            }

            if (block.type === 'user' && block.meta.colour) {
                span.cssClasses.add('user');
                span.color = block.meta.colour;
            }

            if (block.type === 'emoji' && block.meta.emoji) {
                span.text = String.fromCodePoint(`0x${block.meta.emoji}`);
                span.cssClasses.add('messagelist-emoji');
                if (messageBlocks.length === 1) {
                    span.cssClasses.add('messagelist-emoji--single');
                }
            }

            return span;
        });

    spans.forEach((span) => formattedMessage.spans.push(span));
    return formattedMessage;
}
</script>

<style lang="scss">
.formattedmessage-body {
    .formatting-extras-quote {
        background: rgba(0, 0, 0, 0.05);
        font-family: monospace;
    }

    .formatting-extras-invisible {
        font-size: 0;
    }

    .formatting-extras-block {
        background: rgba(0, 0, 0, 0.05);
        font-family: monospace;
    }

    .url,
    .channel {
        color: var(--accent4);
        text-decoration: underline;
    }
    .user {
        text-decoration: underline;
    }

    .messagelist-emoji--single {
        font-size: 30;
    }
}
</style>
