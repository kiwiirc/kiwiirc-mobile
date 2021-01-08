<template>
    <grid-layout v-show="busy">
        <label class="overlay" iosOverflowSafeArea="true" />
        <activity-indicator
            class="activity-indicator"
            width="80"
            height="80"
            v-show="busy"
            :busy="busy"
        />
        <label
            class="login-loadingstatus"
            verticalAlignment="center"
            horizontalAlignment="center"
            :text="loadingStatus"
        />
    </grid-layout>
</template>

<script>
'kiwi public';

export default {
    props: ['busy', 'loadingStatus'],
};
</script>

<style scoped>
.overlay {
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
}
.login-loadingstatus {
    margin-top: 100;
    color: white;
}
</style>
