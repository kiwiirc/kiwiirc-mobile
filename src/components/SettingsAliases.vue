<template>
    <scroll-view class="settings-aliases" v-dismissesIOSKeyboard>
        <stack-layout class="form">
            <label
                class="text-primary p-x-20 p-t-20"
                @tap="show_help = !show_help"
            >
                <formatted-string>
                    <span class="fas" text=" " />
                    <span :text="$t('what_are_aliases')" />
                </formatted-string>
            </label>
            <content-view v-show="show_help" class="">
                <html-view
                    class="settings-aliases-help p-x-20 m-x-20"
                    html='<p styles="color: black">Aliases let you rename existing IRC commands or even build entirely new ones.</p>
                <p>
                    They must be one per line and in the form of <em>/name /what it should do</em>.
                </p>

                <h4>Variables</h4>
                <p>
                    There are several variables that may be used to refer to the current environment
                    such as the active channel or active nick.
                    <ul>
                        <li><em>$server</em> The current network name</li>
                        <li><em>$channel / $destination</em> The current channel / buffer name</li>
                        <li><em>$nick</em> The current nick</li>
                    </ul>
                </p>
                <p>
                    You can also use variables to read input from the typed command. <br >
                    <ul>
                        <li><em>$0</em> The command name</li>
                        <li><em>$1</em> The first argument from the typed input</li>
                        <li><em>$2</em> The second argument from the typed input</li>
                        <li><em>$1+</em> From the first argument to the last argument</li>
                    </ul>
                    <b>Example 1:</b> <em>/greet /msg $1 Hello, $1!</em><br >
                    This creates an IRC command /greet that accepts one argument. Typing "/greet
                    username" will execute "/msg username Hello, username!". <br >
                    <b>Example 2:</b> <em>/ban /quote mode $channel +b $1+</em><br >
                    This creates an IRC command /ban that does a few things. Typing "/ban nick1
                    nick2" will execute "/quote mode #activechannel +b nick1 nick2". $channel is
                    replaced with the active channel name, $1+ is replaced with all the typed input
                    from the first word to the end.
                </p>

                <h4>Helper commands</h4>
                <p>
                    <ul>
                        <li>
                            <em>/echo</em><br >Sends a message to the active buffer without sending
                            it to the IRC network. Eg, /echo Something happened
                        </li>
                        <li>
                            <em>/lines</em><br >
                            Similar to Mirc script, this lets you execute multiples lines of
                            commands separated by a pipe, "|".<br >
                            Example: "/lines /ban nick1 | /echo Banned user" would first execute the
                            /ban command, and then the /echo command. This comes in handy with
                            creating short aliases such as the common "/cycle" command that parts
                            and re-joins the active channel: "/cycle /lines /part $channel | /join
                            $channel".
                        </li>
                    </ul>

                </p>'
                />
            </content-view>
            <content-view>
                <scroll-view orientation="horizontal">
                    <text-view
                        class="settings-aliases-input m-20"
                        :class="{ synced: aliasesSynced }"
                        v-model="textViewAliases"
                        @blur="updateAliases"
                    />
                </scroll-view>
            </content-view>
        </stack-layout>
    </scroll-view>
</template>

<script>
'kiwi public';

export default {
    data() {
        return {
            textViewAliases: '',
            show_help: false,
        };
    },
    computed: {
        aliasesSynced() {
            const realAliases = this.$state.setting('aliases').trim();
            return realAliases === this.textViewAliases;
        },
    },
    methods: {
        updateAliases() {
            this.$state.setting('aliases', this.textViewAliases.trim());
        },
    },
    mounted() {
        this.textViewAliases = this.$state.setting('aliases').trim();
    },
};
</script>

<style>
text-view.settings-aliases-input {
    min-width: 500;
    min-height: 500;
    font-family: monospace;
    font-size: 13;
    border-width: 2;
    border-radius: 10;
    color: var(--default-fg);
    border-color: var(--warning4);
    background-color: var(--input-bg);
    padding: 7;
}

text-view.settings-aliases-input.synced {
    border-color: var(--accent3);
}

.settings-aliases-help {
    border-width: 1;
    padding: 10;
    color: blue;
}
</style>
