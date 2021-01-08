<template>
    <grid-layout class="icon-text-field" iosOverflowSafeArea="false">
        <text-field
            ref="textField"
            v-focusOnIOSKeyboard
            v-bind="$attrs"
            :class="inputClass"
            :text="value"
            verticalAlignment="center"
            @textChange="$emit('input', $event.value)"
            @returnPress="$emit('returnPress', $event)"
        />
        <label
            :text="icon"
            class="icon fas hint-color"
            android:paddingTop="8"
        />
        <button
            v-show="!!value"
            horizontalAlignment="right"
            class="clear-button far"
            text=""
            @touch="clearInput"
        />
    </grid-layout>
</template>

<script>
'kiwi public';

export default {
    props: {
        icon: String,
        value: String,
        inputClass: Object,
    },
    methods: {
        focus() {
            this.$refs.textField.nativeView.focus();
        },
        clearInput(event) {
            if (event.action === 'up') {
                this.$emit('input', '');
                this.$emit('cleared');
            }
        },
    },
};
</script>

<style lang="scss" scoped>
GridLayout.icon-text-field {
    height: 40;
    padding: 0;
    background-color: var(--input-bg);
    border-radius: var(--roundness);
    border-width: 2;
    border-color: var(--input-border);
}
.icon-text-field text-field {
    padding: 4 25 4 44;
    margin: 0;
    border-radius: var(--roundness);
    height: 30;
    placeholder-color: var(--hint-color);
    color: var(--default-fg);
}

.icon-text-field label.icon {
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

.icon-text-field button.clear-button {
    color: var(--input-border);
    font-size: 20;
    background-color: transparent;
    width: 36;
    padding: 0;
    android-elevation: 0;
}

text-field {
    border-width: 0;
    padding-left: 45;
    background-color: transparent;
}
</style>
