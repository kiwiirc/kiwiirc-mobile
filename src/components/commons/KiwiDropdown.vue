<template>
    <dock-layout class="select input" :class="{'select--with-icon': icon}" @tap="openPicker" stretchLastChild="true">
        <label
            v-if="icon"
            :text="icon"
            dock="left"
            class="icon fas hint-color"
            android:paddingTop="8"
        />

        <label
            :rotate="opened ? 180 : 0"
            dock="right"
            class="fas p-x-10"
            verticalAlignment="center"
            text=""
        />
        <label :text="currentItem" class="value" :class="{'value--null': currentItem === nullItem}" />
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
        icon: String,
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
DockLayout.select {
    height: 40;
    padding: 0;
    background-color: var(--input-bg);
    border-radius: var(--roundness);
    border-width: 2;
    border-color: var(--input-border);
}

.select .value {
    margin-left: 15;
    vertical-align: center;
    color: var(--default-fg);
}

.select .value--null {
    color: var(--hint-color);
}

.select--with-icon .value {
    margin-left: 6;
}

.select label.icon {
    padding: 0;
    margin: 0 0 0 10;
    width: 28;
    font-size: 20;
    height: 36;
    horizontal-alignment: left;
    vertical-alignment: center;
    color: #e3e6e8;
    border-right-width: 1;
    border-color: var(--input-border);
}

.nullItem {
    font-style: italic;
}
</style>
