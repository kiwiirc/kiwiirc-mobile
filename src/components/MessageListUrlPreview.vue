<template functional>
    <grid-layout
        :class="[
            'messagelist-message-url-preview',
            data.class,
            data.staticClass,
        ]"
        columns="auto *"
        rows="auto *"
        height="100"
        v-bind="data.attrs"
        v-on="data.on"
    >
        <image
            v-touchPop
            col="0"
            row="0"
            rowSpan="2"
            class="image"
            :src="props.thumbnail"
            stretch="aspectFill"
            @tap="listeners.openUrl && listeners.openUrl(props.url)"
        />
        <label
            v-show="!props.loadingInfo && !props.error"
            col="1"
            row="0"
            class="title-text"
            :text="props.title"
        />
        <label
            v-show="!props.loadingInfo && props.error"
            col="1"
            row="0"
            class="error-text"
            :text="props.error"
        />
        <label
            v-show="props.loadingInfo"
            col="1"
            class="title-placeholder soft-blink"
        />
        <label
            v-show="props.loadingInfo"
            col="1"
            class="title-placeholder second-line soft-blink"
        />
        <label
            col="1"
            row="1"
            class="hostname-text"
            :text="$options.methods.getHostnameText(props)"
        />
    </grid-layout>
</template>
<script>
import URL from 'url-parse';

export default {
    props: ['hideHighlight', 'thumbnail', 'url', 'loadingInfo', 'error', 'title'],
    methods: {
        getHostnameText(props) {
            if (props.loadingInfo || (!props.loadingInfo && !props.error)) {
                const urlParsed = new URL(props.url);
                return urlParsed.hostname;
            } else {
                return props.url;
            }
        },
    },
};
</script>
<style>
.messagelist-message-url-preview .image {
    background-color: var(--neutral1);
    color: var(--neutral3);
    font-size: 20;
    vertical-align: center;
    horizontal-align: left;
    text-align: center;
    border-color: var(--neutral2);
    border-radius: var(--roundness);
    border-width: 1;
    width: auto;
    height: 100;
}

.messagelist-message-url-preview .title-text {
    color: var(--neutral5);
    width: 100%;
    font-size: 13;
    font-weight: bold;
    vertical-align: top;
    text-wrap: true;
    line-height: 1;
    padding-right: 10;
    padding-left: 5;
    padding-bottom: 5;
}

.messagelist-message-url-preview .hostname-text {
    color: var(--neutral3);
    width: 100%;
    font-size: 10;
    font-weight: bold;
    text-align: left;
    vertical-align: top;
    text-wrap: true;
    line-height: 1;
    padding-right: 10;
    padding-left: 5;
}

.messagelist-message-url-preview .title-placeholder {
    background-color: var(--neutral2);
    border-radius: var(--roundness);
    opacity: 0.8;
    height: 13;
    width: 90%;
    vertical-align: top;
    horizontal-align: left;
    margin-top: 2;
    margin-left: 5;
    margin-right: 10;
}
.messagelist-message-url-preview .title-placeholder.second-line {
    width: 40%;
    margin-top: 18;
    margin-bottom: 5;
}

.messagelist-message-url-preview .error-text {
    color: var(--error2);
    width: 100%;
    font-size: 13;
    font-weight: normal;
    font-style: italic;
    vertical-align: top;
    text-wrap: true;
    padding-right: 10;
    padding-left: 5;
    padding-bottom: 5;
}
</style>
