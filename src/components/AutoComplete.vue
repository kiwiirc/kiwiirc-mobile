<template functional>
    <scroll-view orientation="horizontal" class="autocomplete">
        <stack-layout
            class="autocomplete-item-container"
            orientation="horizontal"
        >
            <label
                v-for="item in props.items"
                :key="item.text"
                class="autocomplete-item-value"
                @tap="listeners.selected(item, $event)"
            >{{ item.text }}</label>
        </stack-layout>
    </scroll-view>
</template>

<script>
'kiwi public';

export default {
    props: ['items'],
};
</script>

<style lang="scss">
.autocomplete-item-value {
    margin: 10 10;
    padding: 5;
    background-color: var(--neutral1);
    /* #e9e9e9f5; */
    border-radius: 5;
    color: var(--default-fg);
}
</style>
