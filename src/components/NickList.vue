<template>
    <dock-layout
        :class="{ 'nicklist--filtering': !!user_filter }"
        width="300"
        class="nicklist"
    >
        <nick-list-filter
            ref="user_filter"
            v-model="user_filter"
            :user-count="sortedUsers.length"
            dock="top"
            class="p-x-10 p-y-5"
        />
        <list-view
            v-dismissesIOSKeyboard
            for="user in sortedUsers"
            separator-color="transparent"
            row-height="60"
            backgroundColor="transparent"
            @touch="scrollViewTouch"
        >
            <v-template>
                <nick-list-user
                    :user="user"
                    :network="network"
                    :use-coloured-nicks="buffer.setting('coloured_nicklist')"
                    :mode="userMode(user)"
                    :mode-prefix="userModePrefix(user)"
                    @tap="openUserbox($index)"
                />
            </v-template>
        </list-view>
    </dock-layout>
</template>

<script>
'kiwi public';

import NickListUser from './NickListUser';
import NickListFilter from './NickListFilter';

// Hot function, so it's here for easier caching
function strCompare(a, b) {
    if (a === b) {
        return 0;
    }
    return a > b ? 1 : -1;
}

export default {
    components: { NickListUser, NickListFilter },
    props: ['buffer'],
    data() {
        return {
            user_filter: '',
        };
    },
    computed: {
        network() {
            return this.buffer && this.buffer.getNetwork();
        },
        sortedUsers() {
            if (!this.network || !this.buffer) {
                return [];
            }
            // Get a list of network prefixes and give them a rank number
            let netPrefixes = this.network.ircClient.network.options.PREFIX;
            let prefixOrders = Object.create(null);
            netPrefixes.forEach((prefix, idx) => {
                prefixOrders[prefix.mode] = idx;
            });

            // A few things here:
            // * Since vuejs will sort in-place and update views when .sort is called
            //   on an array, clone it first so that we have a plain array to sort
            // * Keep a map of lowercased nicks to we don't need to call .toLowerCase()
            //   on each one all the time. This is a hot function!
            let nickMap = Object.create(null);
            let users = [];
            let bufferUsers = this.buffer.users;
            let nickFilter = this.user_filter.toLowerCase();
            /* eslint-disable guard-for-in, no-restricted-syntax */
            for (let lowercaseNick in bufferUsers) {
                let user = bufferUsers[lowercaseNick];
                nickMap[user.nick] = lowercaseNick;
                if (!nickFilter || lowercaseNick.indexOf(nickFilter) !== -1) {
                    users.push(user);

                    // This will set the user.colour before users are rendered.
                    // Otherwise, the user colour would be set as elements are
                    // rendered, which causes lots of listview refreshes.
                    user.getColour();
                }
            }

            const bufferId = this.buffer.id;

            return users.sort((a, b) => {
                const bufferA = a.buffers[bufferId];
                const bufferB = b.buffers[bufferId];

                if (!bufferA) {
                    const msg =
                        'Nicklist.sortedUsers() User A does not have the buffer in its list!';
                    log.error(msg, a.nick, a.buffers);
                    return -1;
                }
                if (!bufferB) {
                    const msg =
                        'Nicklist.sortedUsers() User B does not have the buffer in its list!';
                    log.error(msg, b.nick, b.buffers);
                    return 1;
                }

                const modesA = bufferA.modes;
                const modesB = bufferB.modes;

                // Neither user has a prefix, compare text
                if (modesA.length === 0 && modesB.length === 0) {
                    return strCompare(nickMap[a.nick], nickMap[b.nick]);
                }

                // Compare via prefixes..
                if (modesA.length > 0 && modesB.length === 0) {
                    return -1;
                }

                if (modesA.length === 0 && modesB.length > 0) {
                    return 1;
                }

                // Both users have a prefix so find the highest ranking one
                const aP = prefixOrders[modesA[0]];
                const bP = prefixOrders[modesB[0]];
                if (aP > bP) {
                    return 1;
                } else if (aP < bP) {
                    return -1;
                }

                // Prefixes are the same, resort to comparing text
                return strCompare(nickMap[a.nick], nickMap[b.nick]);
            });
        },
    },
    methods: {
        scrollViewTouch() {
            // attaching an event on the ScrollView makes the sidebar dragging work on Android
            // ¯\_(ツ)_/¯
        },
        openUserbox(index) {
            this.$state.$emit(
                'userbox.show',
                this.sortedUsers[index],
                {
                    buffer: this.buffer,
                    network: this.network,
                }
            );
        },
        userMode(user) {
            return this.buffer.userMode(user);
        },
        userModePrefix(user) {
            return this.buffer.userModePrefix(user);
        },
        cleanUp() {
            this.$refs.user_filter.blur();
        },
    },
};
</script>

<style lang="scss">
.nicklist {
    background-color: var(--default-bg);
    border-left-width: 1;
    border-color: rgba(0, 0, 0, 0.3);
}
</style>
