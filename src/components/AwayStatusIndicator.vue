<script>
'kiwi public';

export default {
    functional: true,
    props: ['network', 'user', 'toggle'],
    render(createElement, context) {
        const network = context.props.network;
        const user = context.props.user;
        if (!network || network.state !== 'connected' || !user) {
            return null;
        }

        let awayNotifyEnabled = network.ircClient.network.cap.isEnabled('away-notify');
        if (!(network.appState.setting('buffers.who_loop') || awayNotifyEnabled)) {
            return null;
        }

        const listners = {};
        const toggleable = context.props.toggle &&
            network.appState.getUser(network.id, network.nick) === user;

        if (toggleable) {
            listners.tap = () => {
                network.ircClient.raw('AWAY', user.away ? '' : 'Currently away');
            }
        } 

        return createElement('label', {
            staticClass: context.data.staticClass,
            directives: context.data.directives,
            class: {
                'away': user.away,
                'awaystatusindicator': true,
                ...context.data.class
            },
            attrs: {
                ...context.data.attrs,
            },
            on: listners,
        });
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
