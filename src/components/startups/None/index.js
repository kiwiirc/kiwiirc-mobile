import Logger from '@/libs/Logger';

const log = Logger.namespace('None/index');

export function startup(vueInstance) {
    log('Nothing to do here...');
    return Promise.resolve('nothing to do here...');
}
