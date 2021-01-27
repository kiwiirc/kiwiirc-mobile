<script>
'kiwi public';

import { createNickColour } from '@/helpers/TextFormatting';
import { verticalCenterLabel } from '@mobile/libs/utils/ui';

export default {
    functional: true,
    props: ['user', 'nick', 'large'],
    render(createElement, context) {
        if (!context.props.user && !context.props.nick) {
            return null;
        }

        let classes = [];
        if (context.data.class) {
            classes = context.data.class;
        }

        let avatar = context.props.user && context.props.user.avatar;

        let hasAvatar = !!(avatar && avatar.small);

        let avatarAttrs = {};

        if (hasAvatar) {
            avatarAttrs.backgroundImage = `url("${
                context.props.large && avatar.large
                    ? avatar.large
                    : avatar.small
            }")`;
        } else {
            avatarAttrs.backgroundImage = '';
            avatarAttrs.backgroundColor = getColour(
                context.props.user,
                context.props.nick
            );
            avatarAttrs.text = firstNickLetter(
                context.props.user,
                context.props.nick
            );
        }

        const touchEvents = {};
        if (context.listeners.tap) {
            touchEvents.tap = (event) => context.listeners.tap(event);
        }
        if (context.listeners.doubleTap) {
            touchEvents.doubleTap = (event) => context.listeners.doubleTap(event);
        }

        const el = createElement('label', {
            staticClass: context.data.staticClass,
            directives: context.data.directives,
            class: [...classes, 'avatar'],
            attrs: {
                ...context.data.attrs,
                ...avatarAttrs,
            },
            on: {
                loaded: (event) => {
                    verticalCenterLabel(event.object);
                },
                ...touchEvents,
            },
        });

        return el;
    },
};

function getColour(user, nick) {
    if (user) {
        return user.getColour();
    } else if (nick) {
        return createNickColour(nick);
    }
    return null;
}

function firstNickLetter(user, nick) {
    if (user && user.nick) {
        return user.nick[0];
    } else if (nick) {
        return nick[0];
    }
    return '';
}
</script>

<style lang="scss">
.avatar {
    width: 40;
    height: 40;
    background-color: var(--default-fg);
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    color: var(--default-bg);
    border-width: 2;
    border-color: rgba(0, 0, 0, 0.1);
    text-align: center;
    font-size: 25;
    padding: 0 0 0 1;
    text-transform: uppercase;
    border-radius: 50%;
    font-weight: 600;
    border-width: 2;
}
</style>
