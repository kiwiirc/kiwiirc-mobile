<template functional>
    <scroll-view orientation="horizontal" class="autocomplete">
        <stack-layout
            class="autocomplete-item-container"
            orientation="horizontal"
        >
            <label
                v-for="item in props.items"
                :key="item.text"
                class="autocomplete-item"
                :class="'autocomplete-item--' + item.type"
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
.autocomplete {
    background-color: #34383a44;
}

.autocomplete-item {
    margin: 10 10;
    padding: 5;
    background-color: var(--neutral1);
    /* #e9e9e9f5; */
    border-radius: 5;
    color: var(--default-fg);
}

.autocomplete-item--command {
    background-color: var(--neutral5);
    color: var(--neutral2);
}

</style>
