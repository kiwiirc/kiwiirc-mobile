import Logger from '@/libs/Logger';
import getBncLogin from '@mobile/libs/BncLogin';
import Bouncer from './Bouncer';

const log = Logger.namespace('Bouncer/index');

export function startup(vueInstance, state) {
    if (state.networks.length > 0) {
        const bncLogin = getBncLogin(state, log);
        bncLogin.prepare();
        return Promise.resolve('done');
    }
    log('navigating to Bouncer');
    return vueInstance.$showModal(Bouncer, {
        transition: {
            curve: 'easeInOut',
            name: 'fade',
        },
        clearHistory: true,
        fullscreen: true,
    }).then((res) => {
        if (res !== 'done') {
            return Promise.reject('Error logging in.');
        }
        return Promise.resolve('done');
    });
}
