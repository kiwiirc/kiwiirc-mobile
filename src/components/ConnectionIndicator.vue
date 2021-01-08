<template>
    <label
        v-show="loadingState !== 'done'"
        text=""
        class="connection-loading-indicator fas"
        :class="['state-' + loadingState]"
        @tap="$emit('loadingTap')"
    />
</template>

<script>
export default {
    props: ['loadingState'],
};
</script>

<style lang="scss">
.connection-loading-indicator {
    color: var(--neutral3);
    font-size: 20;
    vertical-align: center;

    &.state-disconnected {
        color: var(--error3);
    }

    &.state-connecting {
        color: var(--accentstrong3);
        animation-name: spin;
        animation-duration: 20s;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
    }

    &.state-loading {
        color: var(--success3);
        animation-name: spin;
        animation-duration: 20s;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
    }

    &.state-done,
    &.state-connected {
        color: var(--neutral4);
    }
}
</style>
