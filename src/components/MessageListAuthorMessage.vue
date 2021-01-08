<template functional>
    <grid-layout
        v-cellHighlight
        scaleY="-1"
        columns="50, *"
        rows="25, auto"
        :class="[
            'messagelist-author',
            'messagelist-item',
            {
                'messagelist-item--own': props.message.isOwn,
                'messagelist-item--unread': props.message.isUnread,
                'messagelist-item--first': props.isFirst,
            },
            'messagelist-author-' + props.message.type,
        ]"
    >
        <content-view
            col="0"
            row="1"
            colSpan="2"
        >
            <message-list-message
                :message="props.message"
                hideHighlight="true"
                @openMessageOptions="listeners.openMessageOptions"
                @openUrl="listeners.openUrl"
            />
        </content-view>
        <absolute-layout
            col="0"
            row="0"
            rowSpan="2"
            android:paddingTop="2"
            verticalAlignment="top"
            class="messagelist-author-avatar-group"
        >
            <avatar
                class="messagelist-author-avatar"
                :user="props.message.userRef"
                :nick="props.message.nick"
                @doubleTap="listeners.nickDoubleTap(props.message.nick)"
                @tap="listeners.openMessageOptions($event, props.message)"
            />
            <away-status-indicator
                class="messagelist-author-awaystatusindicator"
                :network="props.network"
                :user="props.message.userRef"
                toggle="false"
            />
        </absolute-layout>
        <label
            col="1"
            row="0"
            verticalAlignment="top"
            marginBottom="5"
            class="messagelist-author-header"
            @doubleTap="listeners.nickDoubleTap(props.message.nick)"
            @tap="listeners.openMessageOptions($event, props.message)"
        >
            <formatted-string>
                <span
                    class="messagelist-author-nick"
                    :text="
                        props.message.nick + (props.message.nick ? '  ' : '')
                    "
                    :color="props.message.nickColour"
                />
                <span
                    :text="props.message.formatedTime"
                    class="messagelist-author-time p-l-10"
                />
            </formatted-string>
        </label>
    </grid-layout>
</template>

<script>
'kiwi public';

export default {
    props: ['message', 'network', 'isFirst'],
};
</script>

<style lang="scss">
.messagelist-item.messagelist-author {
    .messagelist-author-avatar-group,
    .messagelist-author-header {
        margin-left: 10;
    }

    &.messagelist-item--unread {
        .messagelist-author-avatar-group,
        .messagelist-author-header {
            margin-left: 6;
        }
    }

    .messagelist-author-header {
        line-height: 1;
        vertical-align: top;
        height: 25;
    }
}

.messagelist-author-nick {
    font-size: 18;
    font-weight: bold;
    color: var(--neutral5);
}

.messagelist-author-time {
    color: var(--neutral3);
    font-size: 13;
    margin-bottom: 2;
}

.messagelist-author {
    padding-top: 15;
    padding-bottom: 0;
}

.messagelist-author-first {
    margin-top: 5;
}

.awaystatusindicator.messagelist-author-awaystatusindicator {
    top: 34;
    left: 14;
}
</style>
