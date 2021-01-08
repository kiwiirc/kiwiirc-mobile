<template>
    <grid-layout
        class="nicklist-filter p-0 m-0"
        height="50"
        columns="auto, *, 40"
        android:paddingRight="30"
        @tap="toggleUserFilter"
    >
        <label
            v-show="!(filter_visible || value)"
            colSpan="2"
            col="0"
            class="nicklist-usercount p-x-10 p-y-5"
            :text="$t('person', { count: userCount })"
        />
        <label
            v-show="filter_visible || value"
            col="0"
            class="nicklist-usercount p-x-10 p-y-5"
            :text="userCount"
        />
        <text-field
            v-show="filter_visible || value"
            ref="user_filter"
            col="1"
            class="p-l-10 p-y-5 nicklist-userfilter"
            :text="value"
            autocapitalizationType="none"
            autocorrect="false"
            returnKeyType="search"
            @textChange="$emit('input', $event.value)"
            @blur="onFilterBlur"
        />
        <button
            col="2"
            class="nicklist-usercount-search fas btn btn-text"
            :text="filter_visible || value ? '' : ''"
            @tap="toggleUserFilter"
        />
    </grid-layout>
</template>

<script>
'kiwi public';

export default {
    props: {
        userCount: {
            type: Number,
            required: true,
        },
        value: {
            type: String,
        },
    },
    data() {
        return {
            filter_visible: false,
        };
    },
    methods: {
        toggleUserFilter() {
            this.filter_visible = !this.filter_visible;
            if (this.filter_visible) {
                this.$nextTick(() => this.$refs.user_filter.nativeView.focus());
            } else {
                this.$emit('input', '');
                this.blur();
            }
        },
        onFilterBlur() {
            if (!this.user_filter) {
                this.filter_visible = false;
            }
        },
        blur() {
            this.filter_visible = false;
            if (this.$refs?.user_filter?.nativeView) {
                this.$refs.user_filter.nativeView.dismissSoftInput();
            }
        },
    },
};
</script>

<style>
.nicklist-filter {
    border-bottom-width: 1;
    border-color: rgba(0, 0, 0, 0.3);
    color: var(--default-fg);
}

.nicklist-usercount {
    font-size: 20;
    font-weight: bold;
    color: var(--default-fg);
}

.nicklist-usercount-search {
    color: var(--neutral4);
}
</style>
