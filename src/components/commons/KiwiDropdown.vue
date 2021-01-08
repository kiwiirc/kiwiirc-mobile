<template>
    <dock-layout class="select input" @tap="openPicker">
        <label
            :rotate="opened ? 180 : 0"
            dock="right"
            class="fas p-x-10"
            verticalAlignment="center"
            text=""
        />
        <label :text="currentItem" class="label m-l-10" />
    </dock-layout>
</template>

<script>
'kiwi public';

import { Menu } from 'nativescript-menu';

export default {
    model: {
        prop: 'item',
        event: 'select',
    },
    props: {
        options: {
            type: Array,
            default: () => [],
        },
        item: String,
        nullItem: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            opened: false,
        };
    },
    computed: {
        currentItem() {
            const findItem = this.currentOptions.find((option) => option.id === this.item);

            if (!findItem) {
                this.$emit('select', null);
                return this.nullItem;
            }

            return findItem.title;
        },
        currentOptions() {
            const options = this.options;

            if (typeof options[0] === 'object') {
                return options;
            }

            return options.map((option) => ({ id: option, title: option }));
        },
    },
    methods: {
        openPicker(event) {
            if (this.currentOptions.length === 0) {
                return;
            }

            this.opened = true;

            Menu.popup({
                view: event.object,
                actions: this.currentOptions,
                cancelButtonText: this.$t('cancel'),
            })
                .then((value) => {
                    if (value && value.id !== -1) {
                        this.$emit('select', value.id);
                    }
                })
                .catch(console.log)
                .finally(() => {
                    this.opened = false;
                });
        },
    },
};
</script>

<style scoped>
.select {
}

.nullItem {
    font-style: italic;
}
</style>
