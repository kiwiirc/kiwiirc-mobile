<template functional>
    <grid-layout
        :class="[
            'nicklist-user',
            props.mode ? 'nicklist-user--mode-' + props.mode : '',
            {
                'nicklist-user--away': props.user.away,
                'nicklist-user--ignore': props.user.ignore,
            },
        ]"
        columns="auto auto *"
        @tap="listeners['tap']"
    >
        <avatar col="0" class="nicklist-user-avatar" :user="props.user" />
        <away-status-indicator
            col="0"
            class="nicklist-user-awaystatusindicator"
            :network="props.network"
            :user="props.user"
            toggle="false"
        />
        <label
            col="1"
            class="nicklist-user-prefix m-l-10"
            :text="props.modePrefix"
        />
        <label
            col="2"
            class="nicklist-user-nick"
            :color="props.useColouredNicks ? props.user.getColour() : ''"
            :text="props.user.nick"
        />
    </grid-layout>
</template>

<script>
'kiwi public';

export default {};
</script>

<style>
.nicklist-user {
    border-bottom-width: 1;
    border-color: rgba(0, 0, 0, 0.1);
    padding: 10;
}

.nicklist-user-avatar {
    horizontal-alignment: center;
    vertical-align: top;
}

.awaystatusindicator.nicklist-user-awaystatusindicator {
    horizontal-alignment: left;
    vertical-align: top;
    margin-left: 28;
}

.nicklist-user-nick,
.nicklist-user-prefix {
    font-size: 20;
    padding: 0;
    vertical-align: center;
    color: var(--default-fg);
}

.nicklist-user-nick {
    font-weight: bold;
}
</style>
