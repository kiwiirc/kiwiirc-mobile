<template>
    <label
        v-if="shouldShowStatus"
        :class="{ away: user && user.away }"
        class="awaystatusindicator"
        @tap="toggleSelfAway()"
    />
</template>

<script>
'kiwi public';

export default {
    props: ['network', 'user', 'toggle'],
    computed: {
        isUserSelf() {
            if (this.toggle === false) {
                return false;
            }
            let user = this.$state.getUser(this.network.id, this.network.nick);
            return this.user === user;
        },
        shouldShowStatus() {
            if (!this.network || this.network.state !== 'connected' || !this.user) {
                return false;
            }

            let awayNotifyEnabled = this.network.ircClient.network.cap.isEnabled('away-notify');
            return this.$state.setting('buffers.who_loop') || awayNotifyEnabled;
        },
    },
    methods: {
        toggleSelfAway() {
            if (this.isUserSelf) {
                let val = this.user.away;
                this.network.ircClient.raw('AWAY', val ? '' : 'Currently away');
            }
        },
    }
};
</script>

<style>
.awaystatusindicator {
    width: 12;
    height: 12;
    border-radius: 6;
    border-width: 1;
    border-color: var(--default-bg);
    background-color: var(--success2);
}
.awaystatusindicator.away {
    background-color: var(--warning3);
}
</style>
