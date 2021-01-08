<template>
    <action-bar class="action-bar">
        <NavigationButton visibility="collapsed" />
        <grid-layout
            columns="auto, *, auto, auto, auto"
            width="100%"
            padding="0"
            ios:paddingRight="10"
            ios:paddingLeft="10"
        >
            <button
                class="header-option back fas"
                textAlignment="left"
                :class="{ 'header-option-highlight': hasHighlight }"
                text=""
                @tap="$navigateBack"
            />

            <label
                col="1"
                class="header-title"
                :text="windowTitle"
                @tap="$emit('titleTap')"
            />
        </grid-layout>
    </action-bar>
</template>

<script>
'kiwi public';

export default {
    props: {
        windowTitle: {
            type: String,
            default: '',
        },
    },
    computed: {
        hasHighlight() {
            return this.$state.networks.some(network =>
                network.buffers.some(
                    buffer => buffer.flags.highlight && buffer.flags.unread
                )
            );
        },
    },
};
</script>

<style lang="scss">
.action-bar {
    background-color: var(--primary3);
    color: var(--neutral1);

    .header-title {
        color: var(--default-bg);
        font-size: 20;
        padding: 10 0;
    }
    .header-option {
        text-align: center;
        font-size: 20;
        vertical-align: center;
        width: 45;
        padding: 10 0;
        android-elevation: 0;
        android-dynamic-elevation-offset: 0;
        border-width: 1;
        border-color: transparent;

        &:highlighted {
            color: var(--neutral2);
            animation-name: press;
            animation-duration: 0.2s;
            animation-fill-mode: forwards;
            animation-timing-function: ease;
        }

        &.header-option-highlight {
            color: var(--accentstrong3);
        }

        &.back {
            text-align: center;
            width: 30;
        }
    }
}
</style>
